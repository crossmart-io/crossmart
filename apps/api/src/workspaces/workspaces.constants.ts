export const WORKSPACES_TAG = 'Workspaces';
export const API_KEYS_TAG = 'API keys';
export const ME_ROUTE = 'me';
/** The API key making the request, so a program can find its workspace. */
export const CURRENT_API_KEY_ROUTE = 'api-key';
export const WORKSPACES_ROUTE = 'workspaces';
export const WORKSPACE_ROUTE = 'workspaces/:workspaceId';
export const API_KEYS_ROUTE = 'workspaces/:workspaceId/api-keys';
export const API_KEY_ID_PARAM = 'apiKeyId';
export const API_KEY_NAME_MAX_LENGTH = 100;
export const WORKSPACE_NAME_MAX_LENGTH = 200;
/** The name the generated web client uses for the role enum. */
export const WORKSPACE_ROLE_SCHEMA_NAME = 'WorkspaceRole';
export const WORKSPACE_PERMISSION_SCHEMA_NAME = 'WorkspacePermission';
export const MEMBERS_TAG = 'Members';
export const WORKSPACE_MEMBERS_ROUTE = 'workspaces/:workspaceId/members';
export const MEMBER_USER_ID_PARAM = 'userId';
/** The caller's own membership, so any member can leave. */
export const MEMBERSHIP_ROUTE = 'workspaces/:workspaceId/membership';
export const WORKSPACE_INVITATIONS_ROUTE = 'workspaces/:workspaceId/invitations';
export const INVITATION_ID_PARAM = 'invitationId';
/** Routes for the person holding an invitation link, outside any workspace they belong to. */
export const INVITATIONS_ROUTE = 'invitations';
export const INVITATION_PREVIEW_ROUTE = 'preview';
export const INVITATION_ACCEPT_ROUTE = 'accept';
/** RFC 5321's limit on an address. */
export const EMAIL_MAX_LENGTH = 254;
/** Invitation tokens are 32 random bytes in base64url; anything far longer is not one. */
export const INVITATION_TOKEN_MAX_LENGTH = 128;
export const ROLES_TAG = 'Roles';
export const CUSTOM_ROLES_ROUTE = 'workspaces/:workspaceId/roles';
export const CUSTOM_ROLE_ID_PARAM = 'roleId';
/** Workspaces are created inside an organization, where billing will attach. */
export const ORGANIZATION_WORKSPACES_ROUTE = 'organizations/:organizationId/workspaces';
export const ORGANIZATION_ID_PARAM = 'organizationId';
