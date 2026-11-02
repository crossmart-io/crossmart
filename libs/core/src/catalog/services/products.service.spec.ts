import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OutOfStockPolicy, Prisma, ProductStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ProductDraft } from '../entities/product-draft.js';
import type { ProductDetailRecord, ProductSummaryRecord } from '../repositories/product.queries.js';
import type { ProductUpdateWriter } from '../repositories/product-update.writer.js';
import type { ProductRepository } from '../repositories/product.repository.js';
import { CatalogConflictsService } from './catalog-conflicts.service.js';
import { ProductsService } from './products.service.js';

const WORKSPACE_ID = 'ws-1';
const UPDATED_AT = new Date('2026-11-02T10:00:00Z');
const ACTOR = Actor.user('user-1');

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

function detailRecord(id: string, title: string): ProductDetailRecord {
  const { variants: _variants, media: _media, ...product } = summaryRecord(id, []);
  return { ...product, title, variants: [], media: [] };
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
    delete: vi.fn<ProductRepository['delete']>(() => Promise.resolve(null)),
    findVariantIds: vi.fn<ProductRepository['findVariantIds']>(() =>
      Promise.resolve(new Set(['variant-1'])),
    ),
  };
  const writer = { update: vi.fn<ProductUpdateWriter['update']>(() => Promise.resolve()) };
  const products = repository as unknown as ProductRepository;
  const activity = new InMemoryActivityRecorder();
  const service = new ProductsService(
    products,
    writer as unknown as ProductUpdateWriter,
    new CatalogConflictsService(products),
    activity,
  );
  return { service, repository, writer, activity };
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

    await expect(service.create(WORKSPACE_ID, DRAFT, ACTOR)).rejects.toThrow(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('refuses a SKU another product uses', async () => {
    const { service, repository } = createService();
    repository.findExistingSkus.mockResolvedValue(new Set(['MUG-1']));

    await expect(service.create(WORKSPACE_ID, DRAFT, ACTOR)).rejects.toThrow(ConflictException);
  });
});

describe('ProductsService.create and delete', () => {
  it('records the created product and the deleted product’s title', async () => {
    const { service, repository, activity } = createService();
    repository.create.mockResolvedValue(detailRecord('p-1', 'Mug'));
    repository.delete.mockResolvedValue({ title: 'Old Mug' });

    await service.create(WORKSPACE_ID, DRAFT, ACTOR);
    await service.delete(WORKSPACE_ID, 'p-2', ACTOR);

    expect(
      activity.entries.map(({ action, subject }) => [action, subject?.id, subject?.label]),
    ).toEqual([
      [ActivityAction.ProductCreated, 'p-1', 'Mug'],
      [ActivityAction.ProductDeleted, 'p-2', 'Old Mug'],
    ]);
  });
});

describe('ProductsService lookups', () => {
  it('is not found outside the workspace', async () => {
    const { service } = createService();
    await expect(service.get(WORKSPACE_ID, 'missing')).rejects.toThrow(NotFoundException);
    await expect(service.delete(WORKSPACE_ID, 'missing', ACTOR)).rejects.toThrow(NotFoundException);
  });
});

describe('ProductsService.update', () => {
  const PRODUCT_ID = 'product-1';

  it('lets a product keep its own handle and SKUs', async () => {
    const { service, repository, writer } = createService();
    repository.findDetail.mockResolvedValue(null);

    await service.update(WORKSPACE_ID, PRODUCT_ID, DRAFT, ACTOR).catch(() => undefined);

    expect(repository.findExistingHandles).toHaveBeenCalledWith(WORKSPACE_ID, ['mug'], PRODUCT_ID);
    expect(repository.findExistingSkus).toHaveBeenCalledWith(WORKSPACE_ID, ['MUG-1'], PRODUCT_ID);
    expect(writer.update).toHaveBeenCalledWith(WORKSPACE_ID, PRODUCT_ID, expect.anything(), ACTOR);
  });

  it('refuses a variant id from another product', async () => {
    const { service, writer } = createService();
    const foreignVariant = { ...DRAFT.variants[0]!, id: 'someone-elses-variant' };

    await expect(
      service.update(WORKSPACE_ID, PRODUCT_ID, { ...DRAFT, variants: [foreignVariant] }, ACTOR),
    ).rejects.toThrow(BadRequestException);
    expect(writer.update).not.toHaveBeenCalled();
  });

  it('is not found for a product outside the workspace', async () => {
    const { service, repository } = createService();
    repository.findVariantIds.mockResolvedValue(null);

    await expect(service.update(WORKSPACE_ID, PRODUCT_ID, DRAFT, ACTOR)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('records who updated the product, and nothing when the update was refused', async () => {
    const { service, repository, activity } = createService();
    repository.findDetail.mockResolvedValue(detailRecord(PRODUCT_ID, 'Mug'));

    await service.update(WORKSPACE_ID, PRODUCT_ID, DRAFT, ACTOR);
    repository.findVariantIds.mockResolvedValue(null);
    await service.update(WORKSPACE_ID, PRODUCT_ID, DRAFT, ACTOR).catch(() => undefined);

    expect(activity.recorded).toEqual([
      {
        workspaceId: WORKSPACE_ID,
        actor: ACTOR,
        entry: {
          action: ActivityAction.ProductUpdated,
          subject: { type: ActivitySubjectType.Product, id: PRODUCT_ID, label: 'Mug' },
        },
      },
    ]);
  });
});
