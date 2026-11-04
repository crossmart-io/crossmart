export const WORKSPACE_NOT_FOUND = 'Workspace not found';
export const CONFIRMATION_MISMATCH = 'Type the workspace name exactly to confirm';

/** Why an account cannot be deleted while it owns workspaces others use. */
export function sharedWorkspacesMessage(names: readonly string[]): string {
  return `You own workspaces other people use (${names.join(', ')}). Delete them or ask an owner to remove you first.`;
}
