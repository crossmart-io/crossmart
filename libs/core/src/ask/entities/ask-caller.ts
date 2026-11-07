import type { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { AskCallerType } from '../enums/ask-caller-type.enum.js';

/** The workspace an identified caller asks from, and what they may read in it. */
export interface AskWorkspaceAccess {
  workspaceId: string;
  permissions: ReadonlySet<WorkspacePermission>;
}

/**
 * Who asks, as the API knows them, before anything is hashed. `principalKey` names an
 * identified caller (a person, an API key, or an agent with the user it acts for); anonymous
 * callers have none and are known by their address and user agent.
 */
export interface AskCallerIdentity {
  type: AskCallerType;
  principalKey: string | null;
  clientName: string | null;
  userId: string | null;
  workspace: AskWorkspaceAccess | null;
  ip: string;
  userAgent: string;
}

/** Who asks, as Ask stores and compares them: only salted hashes, never an address. */
export interface AskCaller {
  type: AskCallerType;
  /** Who may continue the caller's conversations; also what escalations are counted by. */
  ownerKey: string;
  /** The salted hash of the address and user agent. */
  clientFingerprint: string;
  clientName: string | null;
  userId: string | null;
  workspace: AskWorkspaceAccess | null;
}
