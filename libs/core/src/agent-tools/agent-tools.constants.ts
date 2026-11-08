/**
 * The REST API as the agent tools call it (the MCP server and Agent Worker). Paths, headers and
 * input limits mirror the API's own; the API enforces its limits as well.
 */
export const API_PREFIX = '/api/v1';
/** `{workspaceId}` is filled in by the API client with the credential's workspace. */
export const WORKSPACE_PATH = `${API_PREFIX}/workspaces/{workspaceId}`;
export const WORKSPACE_PLACEHOLDER = '{workspaceId}';
export const CURRENT_API_KEY_PATH = `${API_PREFIX}/api-key`;
export const API_HEALTH_PATH = `${API_PREFIX}/health`;
/** Ask Crossmart; it needs no workspace, and takes calls without a key. */
export const ASK_PATH = `${API_PREFIX}/ask`;
/** Escalations of an Ask conversation to a person; read with the ticket id alone. */
export const ASK_ESCALATIONS_PATH = `${API_PREFIX}/ask/escalations`;
/** Opens a sandbox account for someone without one (ADR 0019); it takes calls without a key. */
export const SANDBOX_ACCOUNTS_PATH = `${API_PREFIX}/sandbox-accounts`;
/** Outside agents' proposals (ADR 0028): writes that wait for the seller's approval. */
export const AGENT_PROPOSALS_PATH = `${WORKSPACE_PATH}/agent-proposals`;
export const API_KEY_HEADER = 'x-api-key';
export const AUTHORIZATION_HEADER = 'authorization';
export const BEARER_PREFIX = 'Bearer ';
export const JSON_INDENTATION = 2;

/** Input limits; the API enforces its own as well. */
export const MAX_PAGE_SIZE = 100;
export const SEARCH_MAX_LENGTH = 200;
export const NOTE_MAX_LENGTH = 500;
/** Sandbox account input limits; the API's own. */
export const EMAIL_MAX_LENGTH = 254;
export const STORE_NAME_MAX_LENGTH = 200;
/** Products one generate_content call may name; the API's own limit. */
export const CONTENT_GENERATION_MAX_PRODUCTS = 100;

/** A product's URL handle, title and description; the API's own limits. */
export const PRODUCT_HANDLE_MAX_LENGTH = 255;
export const PRODUCT_TITLE_MAX_LENGTH = 255;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 65_535;

/** Item specifics limits; the API's own (eBay's) limits. */
export const ITEM_SPECIFICS_MAX = 60;
export const ITEM_SPECIFIC_NAME_MAX_LENGTH = 40;
export const ITEM_SPECIFIC_VALUES_MAX = 30;
export const ITEM_SPECIFIC_VALUE_MAX_LENGTH = 50;

/** Channel category limits; the API's own. */
export const CATEGORY_ID_MAX_LENGTH = 64;
export const CATEGORY_NAME_MAX_LENGTH = 500;
export const CATEGORY_QUERY_MAX_LENGTH = 255;

/** Listing override limits; the API's own. */
export const OVERRIDE_TEXT_MAX_LENGTH = 255;
export const OVERRIDE_DESCRIPTION_MAX_LENGTH = 65_535;
export const OVERRIDE_MAX_ITEMS = 250;
export const MAX_SHOWN_QUANTITY = 1_000_000;

/** HTTP statuses some tools explain to the agent when the API refuses with them. */
export enum RefusalStatus {
  PaymentRequired = 402,
  NotFound = 404,
  Conflict = 409,
}

/**
 * What an agent reads in place of a new webhook endpoint's signing secret: tool results must not
 * carry credentials, so the person gets the secret in the web app (a rotation shows a new one).
 */
export const WEBHOOK_SECRET_WITHHELD =
  'The signing secret is not shown to agents. To get it, open Settings > Webhooks in the ' +
  'Crossmart web app, open this endpoint and choose Rotate secret: the new secret is shown ' +
  'there once, to give to the service behind the URL.';

/** The answer of an API call that has no body (204). */
export const NO_CONTENT_STATUS = 204;

/** Tools other code refers to by name, such as Agent Worker's before-and-after previews. */
export enum AgentToolName {
  GetProduct = 'get_product',
  CreateProduct = 'create_product',
  ReplaceProduct = 'replace_product',
  UpdateProductText = 'update_product_text',
  UpdateVariantPrice = 'update_variant_price',
  GetInventoryItem = 'get_inventory_item',
  AdjustStock = 'adjust_stock',
  GetStore = 'get_store',
  AddProductToStore = 'add_product_to_store',
  RemoveProductFromStore = 'remove_product_from_store',
  RetryStoreListing = 'retry_store_listing',
  SetStoreCategory = 'set_store_category',
  SaveItemSpecifics = 'save_item_specifics',
  GenerateContent = 'generate_content',
  ApproveSuggestion = 'approve_suggestion',
  AskCrossmart = 'ask_crossmart',
  EscalateToCrossmartTeam = 'escalate_to_crossmart_team',
  GetAskEscalation = 'get_ask_escalation',
  CreateWebhookEndpoint = 'create_webhook_endpoint',
  GetListing = 'get_listing',
  UpdateListing = 'update_listing',
  GetProposal = 'get_proposal',
}

/** What an agent reads when its change waits for the seller (ADR 0028). */
export const PROPOSAL_COPY = {
  proposed:
    "Proposed; waiting for the seller's approval in Crossmart. Nothing has changed yet. Tell " +
    'the user the change is waiting for them under Agent proposals in the Crossmart app, and ' +
    'check its status later with get_proposal. Do not send the same change again.',
} as const;
