import { BadRequestException } from '@nestjs/common';
import type { CatalogFileParser, ImportIssue } from '../../entities/catalog-import.js';
import type { ProductDraft } from '../../entities/product-draft.js';
import { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import type { ProductRepository } from '../../repositories/product.repository.js';
import { CatalogConflictsService } from '../../services/catalog-conflicts.service.js';
import { parseResult } from './__testing__/parse-result.factory.js';
import { productDraft } from './__testing__/product-draft.factory.js';
import { CreateProductsStrategy } from './create-products.strategy.js';
import { importRequest } from './__testing__/import-request.factory.js';

const WORKSPACE_ID = 'ws-1';

function createStrategy(parsed: ProductDraft[], parseIssues: ImportIssue[] = []) {
  const repository = {
    findExistingHandles: vi.fn<ProductRepository['findExistingHandles']>(() =>
      Promise.resolve(new Set(['existing'])),
    ),
    findExistingSkus: vi.fn<ProductRepository['findExistingSkus']>(() =>
      Promise.resolve(new Set(['TAKEN'])),
    ),
    createAll: vi.fn<ProductRepository['createAll']>((_workspaceId, drafts) =>
      Promise.resolve(drafts.map((draft) => `${draft.handle}-id`)),
    ),
  };
  const parser: CatalogFileParser = {
    format: CatalogImportFormat.ShopifyCsv,
    parse: () => parseResult(parsed, parseIssues),
  };
  const products = repository as unknown as ProductRepository;
  const strategy = new CreateProductsStrategy(
    [parser],
    products,
    new CatalogConflictsService(products),
  );
  return { strategy, repository };
}

describe('CreateProductsStrategy', () => {
  it('creates new products, skips existing handles and reports SKU clashes with rows', async () => {
    const parseIssue = {
      code: ImportIssueCode.InvalidValue,
      message: 'bad price',
      handle: 'broken',
      row: 9,
    };
    const { strategy, repository } = createStrategy(
      [
        productDraft('new', 'N-1', 'N-2'),
        productDraft('existing', 'E-1'),
        productDraft('clash', 'TAKEN'),
        productDraft('same-file', 'N-1'),
      ],
      [parseIssue],
    );

    const outcome = await strategy.run(WORKSPACE_ID, importRequest(CatalogImportFormat.ShopifyCsv));

    expect(outcome).toMatchObject({
      createdProducts: 1,
      createdVariants: 2,
      updatedProducts: 0,
      productIds: ['new-id'],
    });
    expect(outcome.skipped).toEqual([expect.objectContaining({ handle: 'existing', row: 3 })]);
    expect(outcome.failed.map((issue) => [issue.handle, issue.row])).toEqual([
      ['broken', 9],
      ['clash', 4],
      ['same-file', 5],
    ]);
    expect(repository.createAll).toHaveBeenCalledWith(WORKSPACE_ID, [
      expect.objectContaining({ handle: 'new' }),
    ]);
  });

  it('writes nothing when every product is skipped', async () => {
    const { strategy, repository } = createStrategy([productDraft('existing', 'E-1')]);

    await strategy.run(WORKSPACE_ID, importRequest(CatalogImportFormat.ShopifyCsv));

    expect(repository.createAll).not.toHaveBeenCalled();
  });

  it('reads only the formats it has a parser for', async () => {
    const { strategy } = createStrategy([]);

    expect(strategy.supports(CatalogImportFormat.ShopifyCsv)).toBe(true);
    expect(strategy.supports(CatalogImportFormat.InventoryCsv)).toBe(false);
    await expect(
      strategy.run(WORKSPACE_ID, importRequest(CatalogImportFormat.InventoryCsv)),
    ).rejects.toThrow(BadRequestException);
  });
});
