import { ALL_TOOLS, ANONYMOUS_TOOLS } from '@crossmart/core/agent-tools/tools/index.js';
import { toolAnnotations } from './tool-annotations.js';

/** Every tool's hints as MCP clients see them: readOnly / destructive / openWorld. */
const EXPECTED_HINTS: Record<string, [boolean, boolean, boolean]> = {
  list_products: [true, false, false],
  get_product: [true, false, false],
  create_product: [false, false, false],
  replace_product: [false, true, true],
  update_product_text: [false, true, true],
  update_variant_price: [false, true, true],
  mark_product_sold: [false, true, true],
  list_inventory: [true, false, false],
  get_inventory_item: [true, false, false],
  adjust_stock: [false, true, true],
  list_orders: [true, false, false],
  get_order: [true, false, false],
  list_stores: [true, false, false],
  get_store: [true, false, false],
  get_sync_progress: [true, false, false],
  add_product_to_store: [false, false, true],
  remove_product_from_store: [false, true, true],
  list_store_products: [true, false, false],
  get_product_stores: [true, false, false],
  retry_store_listing: [false, false, true],
  suggest_store_categories: [true, false, false],
  set_store_category: [false, true, true],
  get_item_specifics: [true, false, false],
  save_item_specifics: [false, true, true],
  get_listing: [true, false, false],
  update_listing: [false, true, true],
  get_sales_report: [true, false, false],
  get_inventory_report: [true, false, false],
  get_listing_health_report: [true, false, false],
  get_platform_health: [true, false, false],
  generate_content: [false, false, false],
  list_suggestions: [true, false, false],
  approve_suggestion: [false, true, true],
  list_webhook_endpoints: [true, false, false],
  create_webhook_endpoint: [false, false, true],
  ask_crossmart: [true, false, false],
  escalate_to_crossmart_team: [false, false, true],
  get_ask_escalation: [true, false, false],
  get_proposal: [true, false, false],
  create_account: [false, false, true],
};

describe('toolAnnotations', () => {
  it('gives every tool the hints its behaviour calls for', () => {
    const tools = [...ALL_TOOLS, ...ANONYMOUS_TOOLS];
    const actual = Object.fromEntries(
      tools.map((spec) => {
        const hints = toolAnnotations(spec);
        return [spec.name, [hints.readOnlyHint, hints.destructiveHint, hints.openWorldHint]];
      }),
    );
    expect(actual).toEqual(EXPECTED_HINTS);
  });

  it('never calls a read-only tool destructive', () => {
    const readOnly = { ...ALL_TOOLS[0], readOnly: true, destructive: true, overwrites: true };
    expect(toolAnnotations(readOnly).destructiveHint).toBe(false);
  });

  it('calls only writes that are safe to repeat idempotent', () => {
    const idempotent = [...ALL_TOOLS, ...ANONYMOUS_TOOLS]
      .filter((spec) => toolAnnotations(spec).idempotentHint === true)
      .map((spec) => spec.name);
    expect(idempotent).toEqual(['mark_product_sold']);
    const readOnly = { ...ALL_TOOLS[0], readOnly: true, idempotent: true };
    expect(toolAnnotations(readOnly)).not.toHaveProperty('idempotentHint');
  });
});
