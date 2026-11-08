# Agent Worker

Agent Worker is the AI agent inside the Crossmart web app. A person asks it to do something
("Fix my failed eBay listings"); it reads what it needs and proposes the changes, which the person
approves or rejects in the chat. The design is in [ADR 0026](decisions/0026-agent-worker.md).

## Configuration

| Variable             | Default             | What                                           |
| -------------------- | ------------------- | ---------------------------------------------- |
| `ANTHROPIC_API_KEY`  | none                | Without it Agent Worker answers 503            |
| `AGENT_WORKER_MODEL` | `claude-sonnet-5-5` | The model of the tool loop                     |
| `BETTER_AUTH_SECRET` | required            | Its derived key signs Agent Worker's API token |

The API must be reachable on `127.0.0.1` at the port it listens on: Agent Worker calls its tools
through it.

## Code map

| Where                                                | What                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `libs/core/src/agent-tools`                          | The tool specs and API client, shared with the MCP server                  |
| `libs/core/src/ai/entities/ai-conversation.ts`       | Provider-neutral conversation with tools; `AiProvider.converse` streams it |
| `libs/core/src/agent-worker/services`                | The loop, tool calls, decisions, turn start and run                        |
| `libs/core/src/agent-worker/rules`                   | Pure rules: transcript, risks, previews, untrusted text                    |
| `libs/core/src/ai/prompts/agent-worker.v1.prompt.ts` | The system prompt                                                          |
| `apps/api/src/agent-worker`                          | Routes, DTOs, the loopback tool executor                                   |
| `apps/api/src/auth/services/request-credentials.ts`  | Accepts Agent Worker's credential, from loopback only                      |

## API

All routes are under `/api/v1/workspaces/{workspaceId}/agent-worker/conversations` and need a
signed-in person with `agent_worker:use`. API keys and agents get 403.

| Route                 | What                                                                    |
| --------------------- | ----------------------------------------------------------------------- |
| `GET /`               | Your conversations, most recently active first                          |
| `POST /`              | Start one                                                               |
| `GET /{id}`           | Messages, tool calls, proposed changes and the active turn              |
| `DELETE /{id}`        | Delete it                                                               |
| `POST /{id}/messages` | `{ text, context? }`, answers with an event stream                      |
| `POST /{id}/decision` | `{ approvedActionIds, confirmHighRisk? }`, answers with an event stream |
| `POST /{id}/cancel`   | Stop the running turn                                                   |

`context` says where the person is: `{ view: "product_map", productId }` makes "this product"
mean that product.

### The event stream

Each server-sent event is named after its `type`, with an `AgentWorkerStreamEventDto` as JSON in
`data`. Lines starting with `:` keep the connection alive.

```
event: turn_started      data: {"type":"turn_started","turn":{…}}
event: message           data: {"type":"message","message":{"role":"user",…}}
event: text_delta        data: {"type":"text_delta","delta":"Let me look"}
event: tool_started      data: {"type":"tool_started","action":{"toolName":"list_store_products",…}}
event: tool_finished     data: {"type":"tool_finished","action":{"status":"succeeded","outcome":"3 found",…}}
event: message           data: {"type":"message","message":{"role":"assistant",…}}
event: action_proposed   data: {"type":"action_proposed","action":{"status":"proposed","preview":{…},"risks":[]}}
event: turn_finished     data: {"type":"turn_finished","turn":{"status":"awaiting_approval",…}}
```

A decision streams `action_decided` for each change (`executed`, `execution_failed`, `rejected`),
then the agent's follow-up. Errors before the stream opens are ordinary JSON errors: 402 (no AI
credits), 403 (sandbox), 404, 409 (a turn is running, or nothing waits), 429 and 503. Errors
during a turn arrive as an `error` event with a `code` (`credits_exhausted`, `ai_unavailable`,
`sandbox_claim_required`, `answer_unusable`, `internal`).

## Adding a tool

Add it to `libs/core/src/agent-tools/tools` like any MCP tool. Agent Worker offers it when its
`scope` is one of `AGENT_WORKER_SCOPES` and the person's role holds a permission of that scope.
Mark `destructive`, `publishes` or `priceInputs` where they apply, so its proposals get the right
risks. Give every write tool a preview formatter in
`libs/core/src/agent-worker/previews/formatters` (an `ActionPreviewFormatter` with its headline,
target, labelled before/after values and details, reading through `PreviewReader`) and add it to
`ACTION_PREVIEW_FORMATTERS`; a test fails for a write tool without one. Without a formatter the
card shows the values the call sets, labelled from their field names.

## Testing

`AgentWorkerHarness` (`libs/core/src/agent-worker/testing`) wires the whole agent in memory with
the scripted `FakeAiProvider` and a `RecordingToolExecutor`: script the model's replies with
`replyWith([text(…), toolUse(…)])` and assert on the events, tables and executor calls. The e2e
test (`apps/api/test/agent-worker.e2e-spec.ts`) listens on a random port so tools run through the
real API. No test calls a model.
