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

/** A product's URL handle; the API's own limit. */
export const PRODUCT_HANDLE_MAX_LENGTH = 255;

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

/** The answer of an API call that has no body (204). */
export const NO_CONTENT_STATUS = 204;

/** Tools other code refers to by name, such as Agent Worker's before-and-after previews. */
export enum AgentToolName {
  GetProduct = 'get_product',
  ReplaceProduct = 'replace_product',
  GetListing = 'get_listing',
  UpdateListing = 'update_listing',
}
