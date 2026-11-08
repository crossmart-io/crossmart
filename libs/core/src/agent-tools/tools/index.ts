import type { ApiToolSpec } from './api-tool.js';
import { ASK_TOOLS } from './ask.tools.js';
import { CATALOG_TOOLS } from './catalog.tools.js';
import { INVENTORY_TOOLS } from './inventory.tools.js';
import { LISTING_EDITOR_TOOLS } from './listing-editor.tools.js';
import { LISTING_TOOLS } from './listings.tools.js';
import { ORDER_TOOLS } from './orders.tools.js';
import { PROPOSAL_TOOLS } from './proposals.tools.js';
import { REPORT_TOOLS } from './reports.tools.js';
import { STORE_TOOLS } from './stores.tools.js';
import { SUGGESTION_TOOLS } from './suggestions.tools.js';
import { WEBHOOK_TOOLS } from './webhooks.tools.js';

export { ANONYMOUS_TOOLS } from './account.tools.js';

/** Every tool the server offers, grouped by area. */
export const ALL_TOOLS: readonly ApiToolSpec[] = [
  ...CATALOG_TOOLS,
  ...INVENTORY_TOOLS,
  ...ORDER_TOOLS,
  ...STORE_TOOLS,
  ...LISTING_TOOLS,
  ...LISTING_EDITOR_TOOLS,
  ...REPORT_TOOLS,
  ...SUGGESTION_TOOLS,
  ...WEBHOOK_TOOLS,
  ...ASK_TOOLS,
  ...PROPOSAL_TOOLS,
];
