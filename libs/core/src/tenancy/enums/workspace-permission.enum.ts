/** What a member or API key may do inside a workspace. Roles are sets of these. */
export enum WorkspacePermission {
  ViewWorkspace = 'workspace:view',
  ManageWorkspace = 'workspace:manage',
  DeleteWorkspace = 'workspace:delete',
  ViewMembers = 'members:view',
  ManageMembers = 'members:manage',
  ManageApiKeys = 'api-keys:manage',
  EditCatalog = 'catalog:edit',
  ApproveSuggestions = 'suggestions:approve',
}
