import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OutOfStockPolicy, Prisma, ProductStatus } from '@crossmart/database';
import type { ProductDraft } from '../entities/product-draft.js';
import type { ProductSummaryRecord } from '../repositories/product.queries.js';
import type { ProductUpdateWriter } from '../repositories/product-update.writer.js';
import type { ProductRepository } from '../repositories/product.repository.js';
import { CatalogConflictsService } from './catalog-conflicts.service.js';
import { ProductsService } from './products.service.js';

const WORKSPACE_ID = 'ws-1';
const UPDATED_AT = new Date('2026-11-02T10:00:00Z');

function summaryRecord(id: string, prices: string[]): ProductSummaryRecord {
  return {
    id,
    workspaceId: WORKSPACE_ID,
    handle: id,
    title: id,
    descriptionHtml: '',
    vendor: null,
    productType: null,
    tags: [],
    status: ProductStatus.ACTIVE,
    optionNames: [],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
    media: [],
    variants: prices.map((price, index) => ({
      price: new Prisma.Decimal(price),
      inventoryItem: { tracked: index === 0, available: 4 },
    })),
  };
}

const DRAFT: ProductDraft = {
  handle: 'mug',
  title: 'Mug',
  descriptionHtml: '',
  tags: [],
  status: ProductStatus.DRAFT,
  optionNames: [],
  variants: [
    {
      sku: 'MUG-1',
      optionValues: [],
      price: '10.00',
      requiresShipping: true,
      taxable: true,
      outOfStockPolicy: OutOfStockPolicy.STOP_SELLING,
      inventory: { tracked: true, quantity: 3 },
    },
  ],
  media: [],
};

function createService(records: ProductSummaryRecord[] = []) {
  const repository = {
    listPage: vi.fn<ProductRepository['listPage']>(() => Promise.resolve(records)),
    findDetail: vi.fn<ProductRepository['findDetail']>(() => Promise.resolve(null)),
    findExistingHandles: vi.fn<ProductRepository['findExistingHandles']>(() =>
      Promise.resolve(new Set<string>()),
    ),
    findExistingSkus: vi.fn<ProductRepository['findExistingSkus']>(() =>
      Promise.resolve(new Set<string>()),
    ),
    create: vi.fn<ProductRepository['create']>(),
    delete: vi.fn<ProductRepository['delete']>(() => Promise.resolve(false)),
    findVariantIds: vi.fn<ProductRepository['findVariantIds']>(() =>
      Promise.resolve(new Set(['variant-1'])),
    ),
  };
  const writer = { update: vi.fn<ProductUpdateWriter['update']>(() => Promise.resolve()) };
  const products = repository as unknown as ProductRepository;
  const service = new ProductsService(
    products,
    writer as unknown as ProductUpdateWriter,
    new CatalogConflictsService(products),
  );
  return { service, repository, writer };
}

describe('ProductsService.list', () => {
  it('returns a cursor when the repository found one row more than the limit', async () => {
    const { service } = createService([
      summaryRecord('a', ['5']),
      summaryRecord('b', ['5']),
      summaryRecord('c', ['5']),
    ]);

    const page = await service.list(WORKSPACE_ID, { limit: 2 });

    expect(page.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toBe('b');
  });

  it('summarizes prices and tracked stock', async () => {
    const { service } = createService([summaryRecord('a', ['22', '9.5', '40'])]);

    const { items, nextCursor } = await service.list(WORKSPACE_ID, { limit: 25 });

    expect(nextCursor).toBeNull();
    expect(items[0]).toMatchObject({
      variantCount: 3,
      priceRange: { min: '9.50', max: '40.00' },
      totalAvailable: 4,
    });
  });
});

describe('ProductsService.create', () => {
  it('refuses a handle that is already in the catalog', async () => {
    const { service, repository } = createService();
    repository.findExistingHandles.mockResolvedValue(new Set(['mug']));

    await expect(service.create(WORKSPACE_ID, DRAFT)).rejects.toThrow(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('refuses a SKU another product uses', async () => {
    const { service, repository } = createService();
    repository.findExistingSkus.mockResolvedValue(new Set(['MUG-1']));

    await expect(service.create(WORKSPACE_ID, DRAFT)).rejects.toThrow(ConflictException);
  });
});

describe('ProductsService lookups', () => {
  it('is not found outside the workspace', async () => {
    const { service } = createService();
    await expect(service.get(WORKSPACE_ID, 'missing')).rejects.toThrow(NotFoundException);
    await expect(service.delete(WORKSPACE_ID, 'missing')).rejects.toThrow(NotFoundException);
  });
});

describe('ProductsService.update', () => {
  const PRODUCT_ID = 'product-1';

  it('lets a product keep its own handle and SKUs', async () => {
    const { service, repository, writer } = createService();
    repository.findDetail.mockResolvedValue(null);

    await service.update(WORKSPACE_ID, PRODUCT_ID, DRAFT).catch(() => undefined);

    expect(repository.findExistingHandles).toHaveBeenCalledWith(WORKSPACE_ID, ['mug'], PRODUCT_ID);
    expect(repository.findExistingSkus).toHaveBeenCalledWith(WORKSPACE_ID, ['MUG-1'], PRODUCT_ID);
    expect(writer.update).toHaveBeenCalledWith(WORKSPACE_ID, PRODUCT_ID, expect.anything());
  });

  it('refuses a variant id from another product', async () => {
    const { service, writer } = createService();
    const foreignVariant = { ...DRAFT.variants[0]!, id: 'someone-elses-variant' };

    await expect(
      service.update(WORKSPACE_ID, PRODUCT_ID, { ...DRAFT, variants: [foreignVariant] }),
    ).rejects.toThrow(BadRequestException);
    expect(writer.update).not.toHaveBeenCalled();
  });

  it('is not found for a product outside the workspace', async () => {
    const { service, repository } = createService();
    repository.findVariantIds.mockResolvedValue(null);

    await expect(service.update(WORKSPACE_ID, PRODUCT_ID, DRAFT)).rejects.toThrow(
      NotFoundException,
    );
  });
});
