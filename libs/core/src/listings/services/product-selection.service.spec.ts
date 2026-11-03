import type { ProductSummaryRecord } from '../../catalog/repositories/product.queries.js';
import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import type { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import { ProductSelectionService } from './product-selection.service.js';

const WS = 'ws-1';

function summary(id: string): ProductSummaryRecord {
  return {
    id,
    workspaceId: WS,
    handle: id,
    title: id,
    descriptionHtml: '',
    vendor: null,
    productType: null,
    tags: [],
    status: 'ACTIVE',
    optionNames: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    variants: [],
    media: [],
  };
}

function setup() {
  const repository = {
    count: vi.fn<ProductSelectionRepository['count']>().mockResolvedValue(0),
    listPage: vi.fn<ProductSelectionRepository['listPage']>().mockResolvedValue([]),
    listIds: vi.fn<ProductSelectionRepository['listIds']>(),
    matches: vi.fn<ProductSelectionRepository['matches']>().mockResolvedValue(true),
  };
  return {
    repository,
    service: new ProductSelectionService(repository as unknown as ProductSelectionRepository),
  };
}

describe('ProductSelectionService', () => {
  it('previews a page with each count, and a cursor when more exist', async () => {
    const { service, repository } = setup();
    repository.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(11)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    repository.listPage.mockResolvedValue([summary('a'), summary('b'), summary('c')]);

    const preview = await service.preview(
      WS,
      { filter: {}, includeProductIds: ['x'], excludeProductIds: ['y'] },
      { limit: 2 },
    );

    expect(preview).toMatchObject({
      total: 12,
      matchingFilter: 11,
      addedManually: 2,
      removedManually: 1,
      nextCursor: 'b',
    });
    expect(preview.items.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('has no manual counts without a rule', async () => {
    const { service, repository } = setup();
    repository.count.mockResolvedValue(5);

    const preview = await service.preview(WS, null, { limit: 25 });

    expect(preview).toMatchObject({
      total: 5,
      matchingFilter: 5,
      addedManually: 0,
      removedManually: 0,
    });
    expect(repository.count).toHaveBeenCalledTimes(2);
  });

  it('walks a large selection in id-ordered batches', async () => {
    const { service, repository } = setup();
    const full = Array.from(
      { length: SELECTION_BATCH_SIZE },
      (_, index) => `id-${String(index).padStart(4, '0')}`,
    );
    repository.listIds.mockResolvedValueOnce(full).mockResolvedValueOnce(['id-last']);

    const batches: string[][] = [];
    for await (const batch of service.selectedIds(WS, null)) batches.push(batch);

    expect(batches.map((batch) => batch.length)).toEqual([SELECTION_BATCH_SIZE, 1]);
    expect(repository.listIds.mock.calls[1]?.[2]).toBe(full.at(-1));
  });
});
