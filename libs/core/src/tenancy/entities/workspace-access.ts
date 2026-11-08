import type { OutsideAgentChanges } from '../../workspace-settings/enums/outside-agent-changes.enum.js';
import type { ResolvedRole } from './role-assignment.js';

/** An unclaimed sandbox account (ADR 0019): an AI agent opened it, and its owner must claim it. */
export interface SandboxState {
  /** When the claim link stops working and the account is deleted. */
  claimExpiresAt: Date;
}

/** A workspace as seen by one member: the workspace plus that member's role and permissions. */
export interface WorkspaceAccess extends ResolvedRole {
  id: string;
  organizationId: string;
  name: string;
  /** The name to show: the organization's while the workspace has the default name. */
  displayName: string;
  slug: string;
  /** ISO 4217 code of the catalog's prices. */
  currency: string;
  /** IANA zone where the workspace's day starts, or null until someone sets it. */
  timeZone: string | null;
  /** Set while the workspace is an unclaimed sandbox account; null for every other workspace. */
  sandbox: SandboxState | null;
  /** Whether outside agents' changes wait for approval here (ADR 0028). */
  outsideAgentChanges: OutsideAgentChanges;
}

export interface WorkspaceMemberProfile extends ResolvedRole {
  userId: string;
  name: string;
  email: string;
  joinedAt: Date;
}
