import type { ProductSummary } from '../../catalog/entities/product-views.js';
import type { ProductSummaryRecord } from '../../catalog/repositories/product.queries.js';
import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import type { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import { ProductSelectionService } from './product-selection.service.js';
import type { ProductStoreDisplays } from './product-store-displays.js';

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
    listings: [],
  };
}

function setup() {
  const repository = {
    count: vi.fn<ProductSelectionRepository['count']>().mockResolvedValue(0),
    listPage: vi.fn<ProductSelectionRepository['listPage']>().mockResolvedValue([]),
    listIds: vi.fn<ProductSelectionRepository['listIds']>(),
    matches: vi.fn<ProductSelectionRepository['matches']>().mockResolvedValue(true),
  };
  const storeDisplays = {
    display: vi.fn((_workspaceId: string, summaries: readonly ProductSummary[]) =>
      Promise.resolve(summaries.map((summary) => ({ ...summary, stores: [] }))),
    ),
  };
  return {
    repository,
    storeDisplays,
    service: new ProductSelectionService(
      repository as unknown as ProductSelectionRepository,
      storeDisplays as unknown as ProductStoreDisplays,
    ),
  };
}

const SCOPE = { workspaceId: WS, connectionId: 'conn-1', rule: null };

describe('ProductSelectionService', () => {
  it('previews a page with each count, and a cursor when more exist', async () => {
    const { service, repository, storeDisplays } = setup();
    repository.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(11)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    repository.listPage.mockResolvedValue([summary('a'), summary('b'), summary('c')]);

    const preview = await service.preview(
      { ...SCOPE, rule: { filter: {}, includeProductIds: ['x'], excludeProductIds: ['y'] } },
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
    expect(storeDisplays.display).toHaveBeenCalledOnce();
    expect(storeDisplays.display.mock.calls[0]?.[0]).toBe(WS);
  });

  it('counts products added by hand even without an automatic rule', async () => {
    const { service, repository } = setup();
    repository.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0);
    repository.listPage.mockResolvedValue([]);

    const preview = await service.preview(SCOPE, { limit: 25 });

    expect(preview).toMatchObject({
      total: 3,
      matchingFilter: 0,
      addedManually: 3,
      removedManually: 0,
    });
  });

  it('walks a large selection in id-ordered batches', async () => {
    const { service, repository } = setup();
    const full = Array.from(
      { length: SELECTION_BATCH_SIZE },
      (_, index) => `id-${String(index).padStart(4, '0')}`,
    );
    repository.listIds.mockResolvedValueOnce(full).mockResolvedValueOnce(['id-last']);

    const batches: string[][] = [];
    for await (const batch of service.selectedIds(SCOPE)) batches.push(batch);

    expect(batches.map((batch) => batch.length)).toEqual([SELECTION_BATCH_SIZE, 1]);
    expect(repository.listIds.mock.calls[1]?.[2]).toBe(full.at(-1));
  });
});
