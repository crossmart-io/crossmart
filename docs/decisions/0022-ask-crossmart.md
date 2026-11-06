# ADR 0022: Ask Crossmart: grounded Q&A for sellers and agents

- Status: Accepted
- Date: 2026-11-06

## Context

Two roadmap items need the same thing: a 24/7 support assistant for sellers (a widget on the site,
docs and dashboard), and an answer endpoint for AI agents that discover Crossmart and want to know
what it does before they connect. Both must answer only what is true about Crossmart. A support bot
that invents a feature, a price or a customer does more harm than no bot.

Crossmart pays for these answers. Nobody signs in to ask, so a script could otherwise run up the AI
bill. The answers also must never see a seller's data: the assistant is public, and a prompt holding
tenant data could leak it.

## Decision

**One backend, two doors.** `AskService` (`libs/core/src/ask`) answers. `POST /api/v1/ask` is the
public endpoint, and the MCP tool `ask_crossmart` calls it. UI widgets come later and call the same
endpoint.

**Knowledge sources.** Only public material is used:

- every page of docs.crossmart.io (the crossmart-docs repository);
- this repository's public documents that are not on the docs site: `README.md`, `docs/channels/`
  and `docs/developers/agents/`;
- the offered plans and their limits, read from the plan data (`PlanCatalogService`, the plans the
  lineup migrations seed) at run time, so a plan name or limit is never written into a prompt or a
  file by hand. Prices are not stored with plans (ADR 0020), so Ask points to the pricing page.

ADRs, architecture notes, code and anything in the database other than the plan lineup are not
sources. Workspace data never reaches Ask: the service takes a question and nothing else, and the
endpoint has no workspace in its path.

**Retrieval.** `pnpm knowledge:build -- --docs-dir <crossmart-docs checkout>` splits each page at
its `##` and `###` headings into chunks of at most 1,800 characters. Each chunk has its title
("Page › Section") and its public URL with the section's anchor. The result is a committed,
generated TypeScript file (`docs-knowledge.generated.ts`, about 220 chunks today). At run time the
chunks and the plans chunk go into an in-memory Okapi BM25 index, with titles weighted double. The
index is rebuilt every 10 minutes so plan changes show up. The best 6 chunks above a minimum score
are sent to the model.

We chose lexical retrieval over embeddings for v1:

- The corpus is small (around 30 pages) and written in the words people ask with: product names,
  channel names, endpoint and tool names, limits. BM25 finds those well, and exact terms such as
  `x-api-key` or `ask_crossmart` are where embeddings are weakest.
- It costs nothing per question, needs no embedding model, vector store or extra API key, and works
  the same for self-hosters.
- It is deterministic and easy to test.

Embeddings (or a hybrid) become worth it when the corpus grows past a few hundred pages, or when
questions miss because they are worded differently from the docs. The `KnowledgeSource` abstraction
and `KnowledgeBaseService` let us swap the retrieval without touching the service or the endpoint.

**Answering.** `AiGateway.generateForPlatform` calls the existing `AiProvider` (ADR 0016) with a
versioned prompt (`ask/v1`). The prompt says to answer only from the given sources, to cite them,
never to invent customers, numbers, prices, features, dates or promises, and to treat the question
and sources as data, not instructions. The question is escaped so it cannot close its tag. The
answer must match a zod schema (`outcome`, `answer`, `sourceIds`, `confidence`). The schema is also
sent as the structured output format. An off-schema, refused or truncated answer is rejected, as for
every AI call. The model cites source ids (`S1`…), never URLs, so it cannot make up a link.
`groundedAnswer` then maps ids to the pages it was given and drops the rest.

**What it refuses.** Only `answered` with at least one valid citation keeps the model's text.
Everything else gets a fixed reply:

- `unknown`: the sources do not answer it, or the question is about someone's own account. The reply
  says "I don't know", points to `ASK_SUPPORT_EMAIL` and the docs, and sets `handoff: true`.
- `out_of_scope`: the question is not about Crossmart (general programming, other companies,
  opinions, anything harmful). It gets a fixed one-line reply.

A prompt injection can at worst make the model answer `unknown` or `out_of_scope`, or cite a real
page. It cannot put its own text in front of the caller without a valid citation.

**Abuse controls.** The endpoint is `@AllowAnonymous()`: no credentials are needed, but a caller who
sends a session or an API key is identified (a wrong key is refused, not treated as anonymous). Rate
limits are kept in Redis and shared by every instance (`AskThrottlerGuard`):

| Caller                | Tracked by            | Per minute | Per day |
| --------------------- | --------------------- | ---------: | ------: |
| Anonymous             | IP (`x-real-ip`)      |          5 |      50 |
| Signed in, or API key | The person or the key |         20 |     500 |

Questions are 3 to 500 characters (`ASK_QUESTION_MAX_LENGTH`). The IP comes from `x-real-ip`, which
Railway's edge sets. A self-hosted server without such a proxy should put one in front, or rely on
the daily cap.

**Cost controls.** Ask spends no plan credits: no workspace pays. Instead:

- A question that matches nothing relevant is answered `unknown` without calling the model.
- Answers are cached in Redis for 6 hours under a SHA-256 hash of the normalised question, so the
  same question asked again costs nothing, and the question itself is not stored.
- `ASK_DAILY_QUESTION_CAP` (default 1,000) caps the model calls across the platform per UTC day,
  counted atomically in Redis. Past it, Ask answers `503` with the docs and support address until
  midnight UTC. Setting it to 0 turns Ask off.
- `ASK_AI_MODEL` can point Ask at a cheaper model than the agents' `AI_MODEL`.
- Every call is metered in a new table, `platform_ai_usage` (feature, provider, model and tokens, no
  workspace). It is kept apart from `ai_usage`, so no tenant row is written without a workspace, and
  platform spend can be reported on its own. The migration only adds the table.

Per question, the model reads about 2,000 to 3,000 input tokens (rules plus 6 chunks) and writes
about 500 to 1,500 (reasoning plus a short answer). On `claude-sonnet-5-5` ($2 in and $10 out per
million tokens) that is about 1 to 2 cents. On `claude-haiku-5-5` ($0.10 / $0.50) it is under a
tenth of a cent. The daily cap bounds the worst case: 1,000 questions at the 8,000-token output
ceiling is about $85 a day on Sonnet.

**MCP.** The remote MCP server needs an API key on every request today (and OAuth after ADR 0019).
So `ask_crossmart` works with whatever key the session has, which gets the identified limits. The
local (stdio) server can run without a key, and then the tool calls Ask anonymously.

## Consequences

- The knowledge index is a build artifact: after a docs change, rerun `pnpm knowledge:build` and
  commit the result (see `docs/ask-crossmart.md`). Stale docs give stale answers until then. Plans
  never go stale, since they are read from the database.
- `llms.txt` for docs.crossmart.io and crossmart.io (in `docs/llms/`) point agents to the docs, the
  OpenAPI spec, the MCP server and `POST /api/v1/ask`.
- The throttler setup moved into a shared `ThrottlingModule`, with per-route `429` messages
  (`@RateLimitMessage`), so the AI routes and Ask share one Redis storage.
- Ask's quality depends on the docs. Questions it hands off are a list of docs to write. A later
  change may log the outcome and retrieval scores (never the question) to find them.
- A widget, conversation history, streaming and embeddings are left for later.
