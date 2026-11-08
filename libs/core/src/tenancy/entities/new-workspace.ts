import type { OutsideAgentChanges } from '../../workspace-settings/enums/outside-agent-changes.enum.js';

export interface WorkspaceInput {
  name: string;
  /** ISO 4217 code of the catalog's prices; fixed once the workspace exists. */
  currency?: string;
  /** IANA zone where the workspace's day starts, such as the creator's own. */
  timeZone?: string;
}

/** What can change on an existing workspace. Its currency cannot. */
export interface WorkspaceChanges {
  name?: string;
  timeZone?: string;
  /** Whether outside agents' changes wait for approval (ADR 0028); people only may change it. */
  outsideAgentChanges?: OutsideAgentChanges;
}
