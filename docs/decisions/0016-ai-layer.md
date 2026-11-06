# ADR 0016: AI provider abstraction, metering and the suggestions engine

- Status: Accepted
- Date: 2026-11-05

## Context

ADR 0002 makes Crossmart AI-native: agents propose, people approve. The first agent, the Content
Generator, writes channel titles and descriptions. It needs a model provider that can be swapped
(BYOK and other providers come later), usage metering for plans and credits, and a review flow
that cannot be bypassed and never applies a change over a newer edit.

## Decision

- **`AiProvider`** (abstract class in `libs/core/src/ai`) is the only seam to a model. The
  Anthropic implementation uses the official `@anthropic-ai/sdk`, the model in `AI_MODEL`
  (default `claude-sonnet-5-5`) and the key in `ANTHROPIC_API_KEY`. Without the key the app
  boots and AI endpoints answer `503 AI is not configured`.
- **`AiGateway`** wraps every call: it meters it, then validates the answer against a zod schema.
  The schema is also sent as the structured-output format. A refused, truncated, non-JSON or
  off-schema answer is rejected and nothing from it is stored. Prompts and answers are never
  logged. Where the model supports it, Anthropic's server-side refusal fallback is on.
- **Metering:** every call writes an `ai_usage` row (workspace, feature, provider, model, input
  and output tokens), including calls whose answer is then rejected, since the tokens were spent.
  `AiUsageService.report` sums a period per feature and model.
- **Credits:** one AI call is one `ai_credits` credit (`AI_CREDITS_PER_CALL`), counted per UTC
  month from the `ai_usage` rows. `AiGateway` asserts a credit is left before calling the provider,
  so a plan's limit (HTTP 402 while plans are enforced) caps spend. Pricing credits per token may
  come later, metered from the same rows. The AI routes are also rate limited per workspace and
  caller, in Redis.
- **Suggestions** (`libs/core/src/suggestions`) hold a target (product, optional connection), a
  kind (`SuggestionKind`, stored as text), the value it replaces as it was when made, the proposed
  value, a rationale, who made it (agent, user or API key) and the requester, and a review.
  Approving re-reads what the listing shows: if it differs from the stored current value, the
  suggestion becomes `STALE` and nothing is applied. Otherwise the change goes through
  `ListingOverridesService`, as a user's edit would (validated, synced, logged). The review is
  claimed with a conditional update first, so two approvals never apply twice. A new proposal
  for the same field replaces an older pending one (marked `STALE`).
- **Content Generator** runs as a BullMQ job on a new, lowest-priority `ai` queue, one job per
  product and store, queued in one `addBulk`, deduplicated while waiting. Channel rules (title
  length, HTML allowed, links, guidance) are constants per channel; channels without rules cannot
  be generated for yet. Prompts are versioned files in `libs/core/src/ai/prompts`.
- **Content drafts** (`POST /ai/content-drafts`) are the interactive path: a merchant editing a
  title or description asks for a rewrite (optionally with an instruction such as "shorter"), for
  the catalog or for one store, and gets the text back right away to keep, edit or discard. It is
  a synchronous call on the API, metered as `content_draft`, with nothing queued or stored; the
  merchant's save is the review. The catalog has its own channel-neutral content rules. Background
  agents keep using suggestions.
- **Permissions:** `suggestions:view` (every role), `ai:generate` (Owner, Admin, Editor) and the
  existing `suggestions:approve` (Owner, Admin, Approver) for approving and rejecting.

## Consequences

Agents never write catalog data directly; everything they do is a reviewable suggestion applied
by the same services as a person. Autonomy policies (auto-apply per action type) can later call
the same `SuggestionApplier`. New kinds (attributes, categories) add a `SuggestionKind` and how
it applies; values are text today, so a structured kind will need typed columns or a validated
JSON value. Product-level (no channel) suggestions are modelled but not yet applicable.
