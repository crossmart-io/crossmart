# Roles and permissions

Every member and every API key in a workspace has a role. A role is a set of permissions, and
each route requires one permission. The rule lives in
[`role-permissions.ts`](../libs/core/src/tenancy/permissions/role-permissions.ts). Callers that are
not in the workspace get `404`, so workspace ids don't leak. Callers in the workspace that lack the
permission get `403 Requires the <permission> permission`.

`GET /api/v1/workspaces/{workspaceId}` returns the caller's `permissions`. Clients should check
those, not the role name, so they keep working when roles change.

| Permission            | Allows                                                               | Owner | Admin | Editor | Approver | Viewer |
| --------------------- | -------------------------------------------------------------------- | :---: | :---: | :----: | :------: | :----: |
| `workspace:view`      | Open the workspace and its overview                                  |   ✓   |   ✓   |   ✓    |    ✓     |   ✓    |
| `members:view`        | See the members                                                      |   ✓   |   ✓   |   ✓    |    ✓     |   ✓    |
| `products:view`       | Products, saved views, import history                                |   ✓   |   ✓   |   ✓    |    ✓     |   ✓    |
| `inventory:view`      | Stock levels and stock history                                       |   ✓   |   ✓   |   ✓    |    ✓     |   ✓    |
| `orders:view`         | Orders                                                               |   ✓   |   ✓   |   ✓    |    ✓     |   ✓    |
| `reports:view`        | Sales and stock value reports                                        |   ✓   |   ✓   |   ✓    |    ✓     |   ✓    |
| `channels:view`       | Connected stores, their rules and listings                           |   ✓   |   ✓   |   ✓    |    ✓     |   ✓    |
| `activity:view`       | The activity log                                                     |   ✓   |   ✓   |   ✓    |    ✓     |   ✓    |
| `suggestions:view`    | The AI suggestions inbox and outside agents' proposals               |   ✓   |   ✓   |   ✓    |    ✓     |   ✓    |
| `products:edit`       | Create, change, import and delete products, prices and images        |   ✓   |   ✓   |   ✓    |          |        |
| `inventory:edit`      | Adjust stock and import stock files                                  |   ✓   |   ✓   |   ✓    |          |        |
| `listings:edit`       | Add products to stores, remove them, override what one store shows   |   ✓   |   ✓   |   ✓    |          |        |
| `ai:generate`         | Ask the AI agents for content (metered); results need approval       |   ✓   |   ✓   |   ✓    |          |        |
| `agent_worker:use`    | Chat with Agent Worker (metered); its changes need approval          |   ✓   |   ✓   |   ✓    |          |        |
| `suggestions:approve` | Approve (apply) or reject AI suggestions and agents' proposals       |   ✓   |   ✓   |        |    ✓     |        |
| `channels:manage`     | Connect and disconnect stores, set pricing and selection rules, sync |   ✓   |   ✓   |        |          |        |
| `members:manage`      | Invite, change roles and remove members                              |   ✓   |   ✓   |        |          |        |
| `api-keys:manage`     | Create and revoke API keys                                           |   ✓   |   ✓   |        |          |        |
| `webhooks:manage`     | Add, change and delete webhook endpoints, see their deliveries       |   ✓   |   ✓   |        |          |        |
| `workspace:manage`    | Change the workspace's settings, such as agents needing approval     |   ✓   |   ✓   |        |          |        |
| `billing:view`        | See the organization's plan and usage (in any of its workspaces)     |   ✓   |   ✓   |        |          |        |
| `billing:manage`      | Choose a plan, open the billing portal (in any of its workspaces)    |   ✓   |   ✓   |        |          |        |
| `workspace:delete`    | Delete the workspace and everything in it                            |   ✓   |       |        |          |        |

## AI agents

An agent connected with OAuth ([ADR 0019](decisions/0019-agent-access.md)) acts for the user who
connected it, in the one workspace they picked. Its permissions are those its scopes unlock
(`catalog:read`, `catalog:write`, `orders:read`, `stores:write`, `reports:read`,
`suggestions:write`, `webhooks:write`) that the user's role also holds, worked out again on every
request. `webhooks:write` is the only scope that unlocks `webhooks:manage`, since events carry
workspace data to the URL the agent names. Agents never get `members:*`, `api-keys:manage`,
`channels:manage`, `workspace:manage`, `workspace:delete` or `billing:*`, and they can only call
workspace routes.

Unless the workspace lets outside agents apply changes directly, an agent's writes are proposals
([ADR 0028](decisions/0028-outside-agent-approvals.md)), except new products created as drafts: a
person holding `suggestions:approve`
and the permission the change itself needs approves them, and the change then runs with the
agent's permissions as they are at that moment.

## Rules around roles

- A member or API key can only grant, change or remove roles that its own role covers, meaning it
  holds every permission of that role. An Admin can't touch an Owner or make one.
- A workspace always keeps at least one Owner. Members can't leave their only workspace.
- API keys can't be Owners. A key never has more access than its creator. Revoking a key needs
  the same: the revoker must have every permission the key has, unless they created it. Keys are
  revoked when their creator is removed, and on a demotion when the new role couldn't have created
  them.

## Custom roles

Besides the five built-in roles, a workspace can define its own roles under
`/api/v1/workspaces/{workspaceId}/roles`. Listing it returns both the built-in roles, with their
permissions, and the custom ones. Members, invitations and API keys hold one as
`role: CUSTOM` plus `customRoleId`. The database refuses one without the other.

- Creating, changing and deleting roles needs `members:manage`. Anyone with `members:view` can
  list them.
- A role never holds more than the person defining or editing it has, and never
  `workspace:delete`. `workspace:view` is always added so its holders can open the workspace.
- A change applies to everyone holding the role right away. API keys created by its members that
  now allow more than the role are revoked. Keys that hold the role itself just narrow with it.
- A role still held by a member, a pending invitation or an active API key can't be deleted.
- A role that's somehow gone grants nothing.
