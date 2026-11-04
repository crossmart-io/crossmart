/**
 * What a member or API key may do inside a workspace, one area and action each. Roles are sets
 * of these; routes and the web app check permissions, never role names, so roles can change
 * without touching either.
 */
export enum WorkspacePermission {
  /** Open the workspace and its overview. */
  ViewWorkspace = 'workspace:view',
  /** Change the workspace's settings. */
  ManageWorkspace = 'workspace:manage',
  DeleteWorkspace = 'workspace:delete',
  ViewMembers = 'members:view',
  /** Invite, change roles and remove members. */
  ManageMembers = 'members:manage',
  ManageApiKeys = 'api-keys:manage',
  ViewProducts = 'products:view',
  /** Create, change, import and delete products, their prices and images. */
  EditProducts = 'products:edit',
  ViewInventory = 'inventory:view',
  /** Adjust and import stock. */
  EditInventory = 'inventory:edit',
  ViewOrders = 'orders:view',
  /** Sales and stock value reports. */
  ViewReports = 'reports:view',
  /** Connected stores, their rules and listings. */
  ViewChannels = 'channels:view',
  /** Connect and disconnect stores, set their pricing and selection rules, start a sync. */
  ManageChannels = 'channels:manage',
  /** Add products to stores, remove them, and override what one store shows. */
  EditListings = 'listings:edit',
  ViewActivity = 'activity:view',
  ApproveSuggestions = 'suggestions:approve',
}
