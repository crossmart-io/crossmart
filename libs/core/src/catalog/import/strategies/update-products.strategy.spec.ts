import type { CatalogFileParser } from '../../entities/catalog-import.js';
import type { ProductDraft } from '../../entities/product-draft.js';
import { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import type { ProductUpdateTargetRecord } from '../../repositories/product.queries.js';
import type { ProductUpdateWriter } from '../../repositories/product-update.writer.js';
import type { ProductRepository } from '../../repositories/product.repository.js';
import { CatalogConflictsService } from '../../services/catalog-conflicts.service.js';
import { productDraft } from './__testing__/product-draft.factory.js';
import { UpdateProductsStrategy } from './update-products.strategy.js';
import { IMPORT_ACTOR, importRequest } from './__testing__/import-request.factory.js';

const WORKSPACE_ID = 'ws-1';

function target(id: string, handle: string, sku: string): ProductUpdateTargetRecord {
  return {
    id,
    handle,
    variants: [
      {
        id: `${id}-variant`,
        sku,
        optionValues: [],
        inventoryItem: { tracked: true, available: 7 },
      },
    ],
    media: [],
  };
}

function setup(parsed: ProductDraft[]) {
  const repository = {
    findUpdateTargets: vi
      .fn<ProductRepository['findUpdateTargets']>()
      .mockResolvedValue([target('mug-id', 'mug', 'MUG-1'), target('tote-id', 'tote', 'TOTE-1')]),
    findSkuOwners: vi.fn<ProductRepository['findSkuOwners']>().mockResolvedValue(
      new Map([
        ['MUG-1', 'mug-id'],
        ['TOTE-1', 'tote-id'],
      ]),
    ),
  };
  const writer = { update: vi.fn<ProductUpdateWriter['update']>().mockResolvedValue() };
  const parser: CatalogFileParser = {
    format: CatalogImportFormat.ShopifyCsv,
    parse: () => ({
      products: parsed,
      issues: [],
      rowByHandle: new Map(parsed.map((draft, index) => [draft.handle, index + 2])),
    }),
  };
  const products = repository as unknown as ProductRepository;
  const strategy = new UpdateProductsStrategy(
    [parser],
    products,
    writer as unknown as ProductUpdateWriter,
    new CatalogConflictsService(products),
  );
  return { strategy, repository, writer };
}

describe('UpdateProductsStrategy', () => {
  it('replaces matched products, keeping variant ids and stock, and skips unknown handles', async () => {
    const { strategy, repository, writer } = setup([
      { ...productDraft('mug', 'MUG-1'), title: 'Bigger mug' },
      productDraft('lamp', 'LAMP-1'),
    ]);

    const outcome = await strategy.run(WORKSPACE_ID, importRequest(CatalogImportFormat.ShopifyCsv));

    expect(repository.findUpdateTargets).toHaveBeenCalledWith(WORKSPACE_ID, ['mug', 'lamp']);
    expect(outcome).toMatchObject({ updatedProducts: 1, createdProducts: 0, failed: [] });
    expect(outcome.skipped).toEqual([
      expect.objectContaining({ code: ImportIssueCode.NotFound, handle: 'lamp', row: 3 }),
    ]);
    expect(writer.update).toHaveBeenCalledWith(
      WORKSPACE_ID,
      'mug-id',
      expect.objectContaining({
        title: 'Bigger mug',
        variants: [
          expect.objectContaining({
            id: 'mug-id-variant',
            inventory: { tracked: true, quantity: 7 },
          }),
        ],
      }),
      IMPORT_ACTOR,
    );
  });

  it('fails a product that takes a SKU held by another product', async () => {
    const { strategy, writer } = setup([productDraft('mug', 'TOTE-1')]);

    const outcome = await strategy.run(WORKSPACE_ID, importRequest(CatalogImportFormat.ShopifyCsv));

    expect(outcome.updatedProducts).toBe(0);
    expect(outcome.failed).toEqual([
      expect.objectContaining({ code: ImportIssueCode.DuplicateSku, sku: 'TOTE-1', row: 2 }),
    ]);
    expect(writer.update).not.toHaveBeenCalled();
  });
});
