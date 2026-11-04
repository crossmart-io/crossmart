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
| `products:edit`       | Create, change, import and delete products, prices and images        |   ✓   |   ✓   |   ✓    |          |        |
| `inventory:edit`      | Adjust stock and import stock files                                  |   ✓   |   ✓   |   ✓    |          |        |
| `listings:edit`       | Add products to stores, remove them, override what one store shows   |   ✓   |   ✓   |   ✓    |          |        |
| `suggestions:approve` | Approve AI suggestions                                               |   ✓   |   ✓   |        |    ✓     |        |
| `channels:manage`     | Connect and disconnect stores, set pricing and selection rules, sync |   ✓   |   ✓   |        |          |        |
| `members:manage`      | Invite, change roles and remove members                              |   ✓   |   ✓   |        |          |        |
| `api-keys:manage`     | Create and revoke API keys                                           |   ✓   |   ✓   |        |          |        |
| `workspace:manage`    | Change the workspace's settings                                      |   ✓   |   ✓   |        |          |        |
| `workspace:delete`    | Delete the workspace and everything in it                            |   ✓   |       |        |          |        |

## Rules around roles

- A member or API key can only grant, change or remove roles that its own role covers, meaning it
  holds every permission of that role. An Admin can't touch an Owner or make one.
- A workspace always keeps at least one Owner. Members can't leave their only workspace.
- API keys can't be Owners. A key never has more access than its creator. Keys are revoked when
  their creator is removed, and on a demotion when the new role couldn't have created them.
