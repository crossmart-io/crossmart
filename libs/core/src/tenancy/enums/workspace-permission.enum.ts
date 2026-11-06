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
  /**
   * Add, change and delete webhook endpoints, see their secrets and deliveries. Events carry
   * workspace data to the endpoint's URL, so this is as sensitive as issuing API keys.
   */
  ManageWebhooks = 'webhooks:manage',
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
  /** The AI suggestions inbox: what agents propose, and what was approved or rejected. */
  ViewSuggestions = 'suggestions:view',
  /** Approve or reject AI suggestions. Approving applies the change. */
  ApproveSuggestions = 'suggestions:approve',
  /**
   * See the organization's plan and usage. Held in any workspace of the organization, it opens
   * the organization's subscription.
   */
  ViewBilling = 'billing:view',

  /** Ask the AI agents for content, such as channel titles and descriptions. Metered. */
  GenerateContent = 'ai:generate',
}
