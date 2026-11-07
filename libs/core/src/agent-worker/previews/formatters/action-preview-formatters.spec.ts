import { randomUUID } from 'node:crypto';
import { InventoryMovementReason } from '@crossmart/database/generated/prisma/enums.js';
import { AgentToolName } from '../../../agent-tools/agent-tools.constants.js';
import { StockAdjustmentMode } from '../../../inventory/enums/stock-adjustment-mode.enum.js';
import { RecordingToolExecutor } from '../../testing/recording-tool.executor.js';
import { PreviewReader } from '../preview-reader.js';
import { ACTION_PREVIEW_FORMATTERS } from './index.js';

const PRODUCT_ID = randomUUID();
const STORE_ID = randomUUID();
const ON_STORE = { productId: PRODUCT_ID, connectionId: STORE_ID };
const INHERITED = (value: unknown) => ({ product: value, effective: value });

const PRODUCT = {
  title: 'Linen Shirt',
  descriptionHtml: '<p>Soft linen.</p>',
  vendor: 'Acme',
  productType: null,
  tags: ['linen'],
  status: 'ACTIVE',
  variants: [
    { id: 'v1', sku: 'SHIRT-M', optionValues: ['M'], price: '48.00', compareAtPrice: null },
  ],
};
const LISTING = {
  title: { product: 'Linen Shirt', effective: 'Linen Shirt – Outlet' },
  descriptionHtml: INHERITED('<p>Soft linen.</p>'),
  vendor: INHERITED('Acme'),
  tags: INHERITED(['linen']),
  images: INHERITED([]),
  visibility: INHERITED('VISIBLE'),
  stock: { inventoryBuffer: null, maxQuantity: null },
  variants: [
    {
      variantId: 'v1',
      title: 'M',
      price: INHERITED('24.00'),
      compareAtPrice: INHERITED(null),
      rulePrice: '24.00',
    },
  ],
};

function setup() {
  const executor = new RecordingToolExecutor()
    .answer(AgentToolName.GetProduct, PRODUCT)
    .answer(AgentToolName.GetStore, { displayName: 'Outlet', shopify: { currencyCode: 'EUR' } })
    .answer(AgentToolName.GetListing, LISTING)
    .answer(AgentToolName.GetInventoryItem, {
      productTitle: 'Stoneware Mug',
      sku: 'MUG-BLUE',
      optionValues: ['Blue'],
      onHand: 43,
    })
    .answer('get_workspace', { currency: 'USD' });
  const scope = { workspaceId: randomUUID(), userId: randomUUID(), conversationId: randomUUID() };
  return { executor, reader: new PreviewReader(executor, scope) };
}

function preview(tool: AgentToolName, input: Record<string, unknown>) {
  const formatter = ACTION_PREVIEW_FORMATTERS.find((candidate) => candidate.tool === tool);
  if (!formatter) throw new Error(`No formatter for ${tool}`);
  return formatter.preview(input, setup().reader);
}

describe('action preview formatters', () => {
  it('describes a stock adjustment in words, with on hand before and after and its note', async () => {
    expect(
      await preview(AgentToolName.AdjustStock, {
        inventoryItemId: randomUUID(),
        mode: StockAdjustmentMode.Delta,
        quantity: 20,
        reason: InventoryMovementReason.RECEIVED,
        note: 'Spring delivery',
      }),
    ).toEqual({
      target: 'Stoneware Mug / MUG-BLUE',
      headline: 'Add 20 units (stock received)',
      details: ['Note: Spring delivery'],
      changes: [{ label: 'On hand', before: '43', after: '63' }],
    });
  });

  it.each([
    {
      mode: StockAdjustmentMode.Delta,
      quantity: -3,
      reason: InventoryMovementReason.DAMAGED,
      headline: 'Remove 3 units (damaged)',
      after: '40',
    },
    {
      mode: StockAdjustmentMode.Set,
      quantity: 12,
      reason: InventoryMovementReason.CORRECTION,
      headline: 'Set stock to 12 (count correction)',
      after: '12',
    },
  ])('reads $mode $quantity as "$headline"', async ({ headline, after, ...adjustment }) => {
    const result = await preview(AgentToolName.AdjustStock, {
      inventoryItemId: randomUUID(),
      ...adjustment,
    });
    expect(result.headline).toBe(headline);
    expect(result.changes[0]?.after).toBe(after);
  });

  it('shows store prices as money in the store’s currency', async () => {
    const result = await preview(AgentToolName.UpdateListing, {
      ...ON_STORE,
      variantPrices: [{ variantId: 'v1', price: '19.00', compareAtPrice: null }],
    });
    expect(result.target).toBe('Linen Shirt on Outlet');
    expect(result.headline).toBe(
      'Change how this product shows on Outlet only; the catalog stays as it is',
    );
    expect(result.changes).toEqual([{ label: 'Price (M)', before: '€24.00', after: '€19.00' }]);
  });

  it('labels a listing field reverted to the catalog', async () => {
    const result = await preview(AgentToolName.UpdateListing, { ...ON_STORE, title: null });
    expect(result.changes).toEqual([
      { label: 'Title (from the catalog)', before: 'Linen Shirt – Outlet', after: 'Linen Shirt' },
    ]);
  });

  it('shows only the text a narrow edit changes', async () => {
    const result = await preview(AgentToolName.UpdateProductText, {
      productId: PRODUCT_ID,
      title: 'Linen Shirt – Relaxed Fit',
    });
    expect(result).toEqual({
      target: 'Linen Shirt',
      headline: 'Edit the title in the catalog',
      details: [],
      changes: [{ label: 'Title', before: 'Linen Shirt', after: 'Linen Shirt – Relaxed Fit' }],
    });
  });

  it('says a replace removes what is left out, and shows prices in the workspace currency', async () => {
    const result = await preview(AgentToolName.ReplaceProduct, {
      productId: PRODUCT_ID,
      title: 'Linen Shirt',
      variants: [{ id: 'v1', price: '19.00' }],
    });
    expect(result.headline).toMatch(/left out are removed/);
    expect(result.changes).toEqual([
      { label: 'Price (SHIRT-M)', before: '$48.00', after: '$19.00' },
    ]);
  });

  it('shows one variant’s new prices as money, and a removed compare-at price as none', async () => {
    const result = await preview(AgentToolName.UpdateVariantPrice, {
      productId: PRODUCT_ID,
      variantId: 'v1',
      price: '43.00',
      compareAtPrice: '48.00',
    });
    expect(result).toEqual({
      target: 'Linen Shirt',
      headline: 'Change the catalog price of SHIRT-M',
      details: [],
      changes: [
        { label: 'Price (SHIRT-M)', before: '$48.00', after: '$43.00' },
        { label: 'Compare-at price (SHIRT-M)', before: 'none', after: '$48.00' },
      ],
    });
  });

  it('refuses to preview a variant of another product', async () => {
    await expect(
      preview(AgentToolName.UpdateVariantPrice, {
        productId: PRODUCT_ID,
        variantId: 'v9',
        price: '1.00',
      }),
    ).rejects.toThrow(/not one of/);
  });

  it.each([
    [AgentToolName.AddProductToStore, /^Publish this product/],
    [AgentToolName.RemoveProductFromStore, /^Take this product off/],
    [AgentToolName.RetryStoreListing, /^Publish this listing to the store again/],
  ])('names the product and store for %s', async (tool, headline) => {
    const result = await preview(tool, ON_STORE);
    expect(result.target).toBe('Linen Shirt on Outlet');
    expect(result.headline).toMatch(headline);
  });

  it('lists item specifics and categories in words', async () => {
    const specifics = await preview(AgentToolName.SaveItemSpecifics, {
      ...ON_STORE,
      itemSpecifics: [
        { name: 'Brand', values: ['Acme'] },
        { name: 'Color', values: [] },
      ],
    });
    expect(specifics.details).toEqual(['Brand: Acme', 'Color: removed']);
    const category = await preview(AgentToolName.SetStoreCategory, { ...ON_STORE, category: null });
    expect(category.headline).toMatch(/next publish picks/);
  });

  it('describes content generation and new products plainly', async () => {
    const generation = await preview(AgentToolName.GenerateContent, {
      connectionId: STORE_ID,
      productIds: [randomUUID(), randomUUID()],
    });
    expect(generation.headline).toBe(
      'Write AI titles and descriptions for 2 products on Outlet; they arrive as suggestions to review',
    );
    const created = await preview(AgentToolName.CreateProduct, {
      title: 'Mug',
      variants: [{ sku: 'MUG-1', price: '12.50' }],
    });
    expect(created.headline).toBe('Create a new product with 1 variant (draft)');
    expect(created.changes).toContainEqual({
      label: 'Price (MUG-1)',
      before: null,
      after: '$12.50',
    });
  });

  it('covers every write tool Agent Worker offers', () => {
    const covered = ACTION_PREVIEW_FORMATTERS.map((formatter) => formatter.tool);
    expect(new Set(covered).size).toBe(covered.length);
    expect(covered).toEqual(
      expect.arrayContaining([
        AgentToolName.AdjustStock,
        AgentToolName.UpdateProductText,
        AgentToolName.UpdateListing,
        AgentToolName.ApproveSuggestion,
      ]),
    );
  });

  it('reads each source once per preview', async () => {
    const { executor, reader } = setup();
    const formatter = ACTION_PREVIEW_FORMATTERS.find(
      (candidate) => candidate.tool === AgentToolName.UpdateListing,
    );
    await formatter?.preview({ ...ON_STORE, title: 'X' }, reader);
    expect(executor.callsTo(AgentToolName.GetStore)).toHaveLength(1);
  });
});
