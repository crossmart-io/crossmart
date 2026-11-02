import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProductStatus, type ProductView } from '@crossmart/database';
import { MAX_PRODUCT_VIEWS } from '../catalog.constants.js';
import { CatalogGap } from '../enums/catalog-gap.enum.js';
import type { ProductViewRepository } from '../repositories/product-view.repository.js';
import { ProductViewsService } from './product-views.service.js';

const WORKSPACE_ID = 'ws-1';
const CREATED_AT = new Date('2026-11-02T10:00:00Z');

function record(overrides: Partial<ProductView> = {}): ProductView {
  return {
    id: 'view-1',
    workspaceId: WORKSPACE_ID,
    name: 'Out of stock',
    search: null,
    status: null,
    gap: CatalogGap.OutOfStock,
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function setup() {
  const repository = {
    list: vi.fn<ProductViewRepository['list']>().mockResolvedValue([record()]),
    count: vi.fn<ProductViewRepository['count']>().mockResolvedValue(0),
    nameTaken: vi.fn<ProductViewRepository['nameTaken']>().mockResolvedValue(false),
    create: vi.fn<ProductViewRepository['create']>().mockResolvedValue(record()),
    delete: vi.fn<ProductViewRepository['delete']>().mockResolvedValue(true),
  };
  return {
    service: new ProductViewsService(repository as unknown as ProductViewRepository),
    repository,
  };
}

describe('ProductViewsService', () => {
  it('saves a trimmed name and drops an empty search', async () => {
    const { service, repository } = setup();

    await service.create(WORKSPACE_ID, {
      name: '  Drafts ',
      search: '  ',
      status: ProductStatus.DRAFT,
    });

    expect(repository.create).toHaveBeenCalledWith(WORKSPACE_ID, {
      name: 'Drafts',
      search: undefined,
      status: ProductStatus.DRAFT,
    });
  });

  it('refuses a name already used in the workspace', async () => {
    const { service, repository } = setup();
    repository.nameTaken.mockResolvedValue(true);

    await expect(service.create(WORKSPACE_ID, { name: 'Out of stock' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('stops at the per-workspace limit', async () => {
    const { service, repository } = setup();
    repository.count.mockResolvedValue(MAX_PRODUCT_VIEWS);

    await expect(service.create(WORKSPACE_ID, { name: 'One more' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('ignores a stored gap it no longer knows, and 404s an unknown view', async () => {
    const { service, repository } = setup();
    repository.list.mockResolvedValue([record({ gap: 'retired_gap' })]);
    repository.delete.mockResolvedValue(false);

    expect((await service.list(WORKSPACE_ID))[0]?.gap).toBeUndefined();
    await expect(service.delete(WORKSPACE_ID, 'missing')).rejects.toThrow(NotFoundException);
  });
});
