import { DEFAULT_WORKSPACE_NAME } from '../tenancy.constants.js';

/**
 * What people call a workspace. Every merchant's first workspace is named "Default", so until
 * it is renamed it goes by its organization's name, which is the owner's name.
 */
export function workspaceDisplayName(workspaceName: string, organizationName: string): string {
  return workspaceName === DEFAULT_WORKSPACE_NAME ? organizationName : workspaceName;
}
