# Crossmart over A2A

Crossmart speaks the [Agent2Agent protocol](https://a2a-protocol.org) (A2A) **version 1.0**, so
any A2A client can discover it and ask it questions. Behind it is Ask Crossmart: answers from the
public docs with citations, read-only answers about your own workspace when you authenticate, and
a person when it cannot help ([ADR 0025](../decisions/0025-agent-to-agent.md)).

| What          | Where                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Agent Card    | `https://api.crossmart.io/.well-known/agent-card.json`                 |
| JSON-RPC      | `POST https://api.crossmart.io/a2a`                                    |
| Version       | Send `A2A-Version: 1.0` (an empty version means 0.3, which is refused) |
| Methods       | `SendMessage`, `GetTask`, `ListTasks`, `CancelTask`                    |
| Not supported | Streaming, push notifications, the extended Agent Card                 |

## Ask a question

```bash
curl https://api.crossmart.io/a2a -H 'content-type: application/json' -H 'A2A-Version: 1.0' -d '{
  "jsonrpc": "2.0", "id": 1, "method": "SendMessage",
  "params": { "message": { "role": "ROLE_USER", "messageId": "m-1",
    "parts": [{ "text": "Which marketplaces does Crossmart support?" }] } }
}'
```

The result is `{ "task": … }`, already `TASK_STATE_COMPLETED`. The answer is the task's artifact:
a text part, and a data part with `outcome`, `confidence`, `citations` and `escalation`. Send the
task's `contextId` with your next message to ask a follow-up in the same conversation. Only the
same caller can continue it, for 24 hours after its last question.

## Your own workspace

Send a Crossmart API key (`x-api-key`) or an agent access token (`Authorization: Bearer …`, from
the OAuth server the MCP server uses, with `catalog:read`) and Ask can also look up your workspace,
read-only and within that credential's permissions: a product's listings and last errors, the
stores and their status, recent failed listings, and (for API keys whose role allows billing) the
plan and its usage. A wrong credential is refused with HTTP 401.

## A person

When Ask cannot answer, or you ask for one, the task's status carries a message offering a
person. Send a message in the same context with a data part:

```json
{
  "data": {
    "action": "escalate",
    "contactEmail": "owner@example.com",
    "callbackUrl": "https://agent.example.com/crossmart"
  }
}
```

Both fields are optional. The result is a task whose `id` is the ticket id (`esc_…`): it stays
`TASK_STATE_WORKING` until the Crossmart team replies, then `TASK_STATE_COMPLETED` with the reply
as its artifact; poll it with `GetTask`. With a `callbackUrl`, the task's `metadata.callbackSecret`
verifies the signed callback, as for [webhooks](webhooks.md). A caller may escalate 5 times a day.

## Limits and errors

`SendMessage` has the limits of `POST /api/v1/ask` (5 a minute and 50 a day per IP address
anonymously; 20 and 500 identified). Errors are JSON-RPC error objects with A2A's codes, such as
`-32001` (task not found), `-32004` (unsupported operation) and `-32009` (version not supported),
and a `google.rpc.ErrorInfo` detail. Questions and answers are stored for 180 days, redacted.
