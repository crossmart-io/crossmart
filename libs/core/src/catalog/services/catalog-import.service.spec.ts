import { BadRequestException } from '@nestjs/common';
import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import type { CatalogFileParser, ImportIssue } from '../entities/catalog-import.js';
import type { ProductDraft } from '../entities/product-draft.js';
import { CatalogImportFormat } from '../enums/catalog-import-format.enum.js';
import { ImportIssueCode } from '../enums/import-issue-code.enum.js';
import type { ProductRepository } from '../repositories/product.repository.js';
import { CatalogConflictsService } from './catalog-conflicts.service.js';
import { CatalogImportService } from './catalog-import.service.js';

const WORKSPACE_ID = 'ws-1';

function product(handle: string, ...skus: string[]): ProductDraft {
  return {
    handle,
    title: handle,
    descriptionHtml: '',
    tags: [],
    status: ProductStatus.ACTIVE,
    optionNames: skus.length > 1 ? ['Size'] : [],
    variants: skus.map((sku, index) => ({
      sku,
      optionValues: skus.length > 1 ? [`S${index}`] : [],
      price: '1.00',
      requiresShipping: true,
      taxable: true,
      outOfStockPolicy: OutOfStockPolicy.STOP_SELLING,
      inventory: { tracked: true, quantity: 1 },
    })),
    media: [],
  };
}

function createService(parsed: ProductDraft[], parseIssues: ImportIssue[] = []) {
  const repository = {
    findExistingHandles: vi.fn<ProductRepository['findExistingHandles']>(() =>
      Promise.resolve(new Set(['existing'])),
    ),
    findExistingSkus: vi.fn<ProductRepository['findExistingSkus']>(() =>
      Promise.resolve(new Set(['TAKEN'])),
    ),
    createAll: vi.fn<ProductRepository['createAll']>(() => Promise.resolve()),
  };
  const parser: CatalogFileParser = {
    format: CatalogImportFormat.ShopifyCsv,
    parse: () => ({ products: parsed, issues: parseIssues }),
  };
  const products = repository as unknown as ProductRepository;
  const service = new CatalogImportService(
    [parser],
    products,
    new CatalogConflictsService(products),
  );
  return { service, repository };
}

describe('CatalogImportService', () => {
  it('creates new products, skips existing handles and reports SKU clashes', async () => {
    const parseIssue = {
      code: ImportIssueCode.InvalidValue,
      message: 'bad price',
      handle: 'broken',
      row: 9,
    };
    const { service, repository } = createService(
      [
        product('new', 'N-1', 'N-2'),
        product('existing', 'E-1'),
        product('clash', 'TAKEN'),
        product('same-file', 'N-1'),
      ],
      [parseIssue],
    );

    const result = await service.importFile(
      WORKSPACE_ID,
      CatalogImportFormat.ShopifyCsv,
      Buffer.from(''),
    );

    expect(result.createdProducts).toBe(1);
    expect(result.createdVariants).toBe(2);
    expect(result.skipped.map((issue) => issue.handle)).toEqual(['existing']);
    expect(result.failed.map((issue) => issue.handle)).toEqual(['broken', 'clash', 'same-file']);
    expect(repository.createAll).toHaveBeenCalledWith(WORKSPACE_ID, [
      expect.objectContaining({ handle: 'new' }),
    ]);
  });

  it('writes nothing when every product is skipped', async () => {
    const { service, repository } = createService([product('existing', 'E-1')]);

    await service.importFile(WORKSPACE_ID, CatalogImportFormat.ShopifyCsv, Buffer.from(''));

    expect(repository.createAll).not.toHaveBeenCalled();
  });

  it('refuses a format without a parser', async () => {
    const { service } = createService([]);
    await expect(
      service.importFile(WORKSPACE_ID, 'xlsx' as CatalogImportFormat, Buffer.from('')),
    ).rejects.toThrow(BadRequestException);
  });
});
