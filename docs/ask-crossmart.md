# Ask Crossmart

Ask Crossmart answers questions about Crossmart from its public docs and plan lineup, for sellers
(the widgets on crossmart.io and in the app) and AI agents (`POST /api/v1/ask`, the MCP tool
`ask_crossmart`, and A2A at `/a2a`). It keeps conversations, can read a signed-in caller's own
workspace, stores every question for the team, and hands a conversation to a person on request.
The design is in [ADR 0022](decisions/0022-ask-crossmart.md) and
[ADR 0025](decisions/0025-agent-to-agent.md).

## Configuration

Set on the API service. Ask also needs `ANTHROPIC_API_KEY` (ADR 0016) and Redis.

| Variable                 | Default              | Meaning                                                        |
| ------------------------ | -------------------- | -------------------------------------------------------------- |
| `ASK_DAILY_QUESTION_CAP` | `1000`               | Model calls per UTC day across the platform; `0` turns Ask off |
| `ASK_AI_MODEL`           | `AI_MODEL`           | The model Ask answers with, such as a cheaper one              |
| `ASK_SUPPORT_EMAIL`      | `hello@crossmart.io` | Where answers that hand off send people                        |
| `ASK_ESCALATION_EMAIL`   | `hello@crossmart.io` | Who gets escalated conversations by email                      |
| `PLATFORM_ADMIN_EMAILS`  | empty                | Verified emails that may read conversations and reply          |

Rate limits per caller are constants in `apps/api/src/ask/ask.constants.ts`. Model calls are metered
in `platform_ai_usage`:

```sql
SELECT date_trunc('day', created_at) AS day, model, count(*) AS questions,
       sum(input_tokens) AS input_tokens, sum(output_tokens) AS output_tokens
FROM platform_ai_usage WHERE feature = 'ask' GROUP BY 1, 2 ORDER BY 1 DESC;
```

## Stored conversations and escalations

Every question and answer is stored in `ask_conversations` and `ask_turns`, with secrets and
email addresses redacted and no IP address (only salted hashes), for 180 days after the
conversation's last question. The worker's daily `ask-retention` job deletes older ones.
Platform admins read them in the web app under **Platform → Ask insights**, or with the
`/api/v1/admin/ask/*` routes, and reply to escalations there. Each escalation emails
`ASK_ESCALATION_EMAIL` a link to the conversation. To see what Ask could not answer this week:

```sql
SELECT question, count(*) FROM ask_turns
WHERE outcome = 'unknown' AND created_at > now() - interval '7 days'
GROUP BY question_hash, question ORDER BY 2 DESC LIMIT 20;
```

## A2A

The Agent Card is at `/.well-known/agent-card.json` and the JSON-RPC endpoint at `/a2a`
(A2A 1.0). Both are built from `API_PUBLIC_URL`, so set it to the public API address. See
[developers/a2a.md](developers/a2a.md).

## Refreshing the knowledge index

The docs are chunked at build time into
`libs/core/src/ask/knowledge/docs-knowledge.generated.ts`, which is committed. Rebuild it after
crossmart-docs or crossmart.io changes. The build reads the docs from a checkout and the site's
sections from `https://crossmart.io/llms.txt`:

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart-docs ../crossmart-docs   # or git pull
pnpm knowledge:build -- --docs-dir ../crossmart-docs
git add libs/core/src/ask/knowledge/docs-knowledge.generated.ts
```

The script prints how many chunks and pages it wrote. Its output is already formatted, so
`pnpm format` leaves it as is. The plans are not in the file: Ask reads the offered plans from the
database and rebuilds its index every 10 minutes. To change which sections of crossmart.io are
included, and the home page anchor each one is cited with, edit `SITE_SECTIONS` in
`tools/knowledge-base/knowledge-base.constants.ts`.

Every citation must be a public page: a test fails if a chunk's URL is not on
`PUBLIC_CITATION_HOSTS`. This repository's documents are not read while the repository is private.
`libs/core/src/ask/services/knowledge-retrieval.spec.ts` checks the top sources for representative
questions; if a docs change breaks one, check the answers before committing the new index.

## Calling Ask from a website

`/api/v1/ask` allows cross-origin `POST` from any site, without credentials, so a widget can call
it with `fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body })`.
Do not send cookies: from a site outside `CORS_ORIGINS` they are ignored and the call is
anonymous. Answers are plain text.

## llms.txt

[`llms/`](llms/) holds the `llms.txt` files for docs.crossmart.io and crossmart.io, which tell AI
agents where the docs, the API and Ask are. See [llms/README.md](llms/README.md) for where each goes.
