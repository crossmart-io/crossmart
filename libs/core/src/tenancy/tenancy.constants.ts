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
];
