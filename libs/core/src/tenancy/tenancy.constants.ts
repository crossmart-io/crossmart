import { WorkspaceRole } from '@crossmart/database';

/** A merchant's first workspace. Merchants never see the workspace concept in the UI. */
export const DEFAULT_WORKSPACE_NAME = 'Default';

/** Every API key starts with this, so leaked keys are easy to recognise and scan for. */
export const API_KEY_TOKEN_PREFIX = 'cm_';
export const API_KEY_SECRET_BYTES = 32;
/** How much of the key is stored in plain text, to tell keys apart in the UI. */
export const API_KEY_VISIBLE_PREFIX_LENGTH = 10;
/** `lastUsedAt` is written at most this often per key, so reads do not turn into writes. */
export const API_KEY_LAST_USED_THROTTLE_MS = 60_000;
/** Ownership is never delegated to a key. */
export const API_KEY_ASSIGNABLE_ROLES: readonly WorkspaceRole[] = [
  WorkspaceRole.ADMIN,
  WorkspaceRole.EDITOR,
  WorkspaceRole.APPROVER,
  WorkspaceRole.VIEWER,
  WorkspaceRole.CUSTOM,
];

/** Roles as people read them, in emails. */
export const WORKSPACE_ROLE_NAMES: Readonly<Record<WorkspaceRole, string>> = {
  [WorkspaceRole.OWNER]: 'Owner',
  [WorkspaceRole.ADMIN]: 'Admin',
  [WorkspaceRole.EDITOR]: 'Editor',
  [WorkspaceRole.APPROVER]: 'Approver',
  [WorkspaceRole.VIEWER]: 'Viewer',
  [WorkspaceRole.CUSTOM]: 'Custom',
};

/** How long an invitation link works. Stated in the email. */
export const INVITATION_TTL_DAYS = 7;
const MS_PER_DAY = 86_400_000;
export const INVITATION_TTL_MS = INVITATION_TTL_DAYS * MS_PER_DAY;
export const INVITATION_TOKEN_BYTES = 32;
/** Caps the emails one workspace can send to strangers. */
export const MAX_PENDING_INVITATIONS = 50;
/** The web app page an invitation link opens, with the token in the query. */
export const INVITATION_ACCEPT_PATH = '/invitations/accept';
export const INVITATION_TOKEN_QUERY = 'token';

export const DEFAULT_WORKSPACE_CURRENCY = 'USD';
/** The slug of a workspace whose name has no letters or digits to make one from. */
export const FALLBACK_WORKSPACE_SLUG = 'workspace';
/** Separates a slug from the number that makes it unique: "eu-store-2". */
export const SLUG_SUFFIX_SEPARATOR = '-';
/** The first number given to a slug that is already taken. */
export const FIRST_SLUG_SUFFIX = 2;

export const CUSTOM_ROLE_NAME_MAX_LENGTH = 60;
export const CUSTOM_ROLE_DESCRIPTION_MAX_LENGTH = 200;
/** Enough for real teams, and a bound on what one workspace stores. */
export const MAX_CUSTOM_ROLES = 30;
