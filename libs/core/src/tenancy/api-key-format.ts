/**
 * How an API key looks, in a file of its own with no imports, so the MCP server can read it
 * without loading the database layer.
 */

/** Every API key starts with this, so leaked keys are easy to recognise and scan for. */
export const API_KEY_TOKEN_PREFIX = 'cm_';
/** How much of the key is stored in plain text, to tell keys apart in the UI. */
export const API_KEY_VISIBLE_PREFIX_LENGTH = 10;
