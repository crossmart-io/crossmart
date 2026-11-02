import { OutOfStockPolicy, Prisma, ProductStatus } from '@crossmart/database';
import type { CatalogFileParser, CatalogParseResult } from '../../entities/catalog-import.js';
import type { ProductDraft } from '../../entities/product-draft.js';
import { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import { ProductDraftField } from '../../enums/product-draft-field.enum.js';
import type { ProductUpdateTargetRecord } from '../../repositories/product.queries.js';
import type { ProductUpdateWriter } from '../../repositories/product-update.writer.js';
import type { ProductRepository } from '../../repositories/product.repository.js';
import { CatalogConflictsService } from '../../services/catalog-conflicts.service.js';
import { IMPORT_ACTOR, importRequest } from './__testing__/import-request.factory.js';
import { parseResult } from './__testing__/parse-result.factory.js';
import { productDraft } from './__testing__/product-draft.factory.js';
import { UpdateProductsStrategy } from './update-products.strategy.js';

const WORKSPACE_ID = 'ws-1';
/** The columns of a file with only titles, SKUs and prices. */
const TITLE_SKU_PRICE = new Set([
  ProductDraftField.Title,
  ProductDraftField.Sku,
  ProductDraftField.Price,
]);

function target(id: string, handle: string, sku: string): ProductUpdateTargetRecord {
  return {
    id,
    handle,
    title: handle,
    descriptionHtml: '<p>Kept</p>',
    vendor: 'Kept vendor',
    productType: null,
    tags: ['kept'],
    status: ProductStatus.ACTIVE,
    optionNames: [],
    variants: [
      {
        id: `${id}-variant`,
        sku,
        barcode: '123',
        optionValues: [],
        price: new Prisma.Decimal('5.00'),
        compareAtPrice: null,
        weightGrams: 100,
        requiresShipping: true,
        taxable: true,
        outOfStockPolicy: OutOfStockPolicy.STOP_SELLING,
        inventoryItem: { tracked: true, available: 7 },
      },
    ],
    media: [],
  };
}

function setup(parsed: CatalogParseResult) {
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
  const parser = {
    format: CatalogImportFormat.ShopifyCsv,
    parse: vi.fn<CatalogFileParser['parse']>().mockReturnValue(parsed),
  };
  const products = repository as unknown as ProductRepository;
  const strategy = new UpdateProductsStrategy(
    [parser],
    products,
    writer as unknown as ProductUpdateWriter,
    new CatalogConflictsService(products),
  );
  return { strategy, repository, writer, parser };
}

function run(strategy: UpdateProductsStrategy) {
  return strategy.run(WORKSPACE_ID, importRequest(CatalogImportFormat.ShopifyCsv));
}

describe('UpdateProductsStrategy', () => {
  it('changes only the file columns of matched products and skips unknown handles', async () => {
    const mug: ProductDraft = { ...productDraft('mug', 'MUG-1'), title: 'Bigger mug' };
    const { strategy, repository, writer, parser } = setup(
      parseResult([mug, productDraft('lamp', 'LAMP-1')], [], TITLE_SKU_PRICE),
    );

    const outcome = await run(strategy);

    expect(parser.parse).toHaveBeenCalledWith(expect.any(Buffer), { partial: true });
    expect(repository.findUpdateTargets).toHaveBeenCalledWith(WORKSPACE_ID, ['mug', 'lamp']);
    expect(outcome).toMatchObject({
      updatedProducts: 1,
      createdProducts: 0,
      failed: [],
      productIds: ['mug-id'],
    });
    expect(outcome.skipped).toEqual([
      expect.objectContaining({ code: ImportIssueCode.NotFound, handle: 'lamp', row: 3 }),
    ]);
    expect(writer.update).toHaveBeenCalledWith(
      WORKSPACE_ID,
      'mug-id',
      expect.objectContaining({
        title: 'Bigger mug',
        descriptionHtml: '<p>Kept</p>',
        vendor: 'Kept vendor',
        tags: ['kept'],
        variants: [
          expect.objectContaining({
            id: 'mug-id-variant',
            barcode: '123',
            price: '1.00',
            weightGrams: 100,
            inventory: { tracked: true, quantity: 7 },
          }),
        ],
      }),
      IMPORT_ACTOR,
    );
  });

  it('reports a variant row it cannot match and still updates the rest', async () => {
    const mug = productDraft('mug', 'MUG-1', 'NOT-IN-CATALOG');
    const { strategy, writer } = setup(parseResult([mug], [], TITLE_SKU_PRICE));

    const outcome = await run(strategy);

    expect(outcome.updatedProducts).toBe(1);
    expect(outcome.failed).toEqual([
      expect.objectContaining({
        code: ImportIssueCode.UnmatchedVariant,
        handle: 'mug',
        sku: 'NOT-IN-CATALOG',
        row: 2,
      }),
    ]);
    const [, , written] = writer.update.mock.calls[0] ?? [];
    expect(written?.variants.map((variant) => variant.id)).toEqual(['mug-id-variant']);
  });

  it('validates the merged product and fails it when it is invalid', async () => {
    const mug: ProductDraft = { ...productDraft('mug', 'MUG-1'), optionNames: ['Size'] };
    const fields = new Set([...TITLE_SKU_PRICE, ProductDraftField.Options]);
    const { strategy, writer } = setup(parseResult([mug], [], fields));

    const outcome = await run(strategy);

    expect(outcome.updatedProducts).toBe(0);
    expect(outcome.failed).toEqual([
      expect.objectContaining({ code: ImportIssueCode.InvalidOptions, handle: 'mug', row: 2 }),
    ]);
    expect(writer.update).not.toHaveBeenCalled();
  });

  it('fails a product that takes a SKU held by another product', async () => {
    const { strategy, writer } = setup(parseResult([productDraft('mug', 'TOTE-1')]));

    const outcome = await run(strategy);

    expect(outcome.updatedProducts).toBe(0);
    expect(outcome.failed).toEqual([
      expect.objectContaining({ code: ImportIssueCode.DuplicateSku, sku: 'TOTE-1', row: 2 }),
    ]);
    expect(writer.update).not.toHaveBeenCalled();
  });
});
