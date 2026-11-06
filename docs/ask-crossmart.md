# Ask Crossmart

Ask Crossmart answers questions about Crossmart from its public docs and plan lineup, for sellers (a
support widget, later) and AI agents (`POST /api/v1/ask` and the MCP tool `ask_crossmart`). The
design, its limits and what it refuses are in [ADR 0022](decisions/0022-ask-crossmart.md).

## Configuration

Set on the API service. Ask also needs `ANTHROPIC_API_KEY` (ADR 0016) and Redis.

| Variable                 | Default              | Meaning                                                        |
| ------------------------ | -------------------- | -------------------------------------------------------------- |
| `ASK_DAILY_QUESTION_CAP` | `1000`               | Model calls per UTC day across the platform; `0` turns Ask off |
| `ASK_AI_MODEL`           | `AI_MODEL`           | The model Ask answers with, such as a cheaper one              |
| `ASK_SUPPORT_EMAIL`      | `hello@crossmart.io` | Where answers that hand off send people                        |

Rate limits per caller are constants in `apps/api/src/ask/ask.constants.ts`. Model calls are metered
in `platform_ai_usage`:

```sql
SELECT date_trunc('day', created_at) AS day, model, count(*) AS questions,
       sum(input_tokens) AS input_tokens, sum(output_tokens) AS output_tokens
FROM platform_ai_usage WHERE feature = 'ask' GROUP BY 1, 2 ORDER BY 1 DESC;
```

## Refreshing the knowledge index

The docs are chunked at build time into
`libs/core/src/ask/knowledge/docs-knowledge.generated.ts`, which is committed. Rebuild it after the
docs change (crossmart-docs, `README.md`, `docs/channels/` or `docs/developers/agents/`):

```bash
git clone --depth 1 https://github.com/crossmart-io/crossmart-docs ../crossmart-docs   # or git pull
pnpm knowledge:build -- --docs-dir ../crossmart-docs
git add libs/core/src/ask/knowledge/docs-knowledge.generated.ts
```

The script prints how many chunks and pages it wrote. Its output is already formatted, so
`pnpm format` leaves it as is. The plans are not in the file: Ask reads the offered plans from the
database and rebuilds its index every 10 minutes. To change which documents of this repository
are included, edit `REPOSITORY_DOCUMENTS` in `tools/knowledge-base/knowledge-base.constants.ts`.

## llms.txt

[`llms/`](llms/) holds the `llms.txt` files for docs.crossmart.io and crossmart.io, which tell AI
agents where the docs, the API and Ask are. See [llms/README.md](llms/README.md) for where each goes.
