import { ProductStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { BulkProductAction } from '../enums/bulk-product-action.enum.js';
import type { ProductBulkWriter } from '../repositories/product-bulk.writer.js';
import { BulkProductActionsService } from './bulk-product-actions.service.js';

const WORKSPACE_ID = 'ws-1';
const ACTOR = Actor.user('user-1');

function setup() {
  const writer = {
    setStatus: vi.fn<ProductBulkWriter['setStatus']>().mockResolvedValue(2),
    addTags: vi.fn<ProductBulkWriter['addTags']>().mockResolvedValue(2),
    removeTags: vi.fn<ProductBulkWriter['removeTags']>().mockResolvedValue(2),
    adjustPrices: vi.fn<ProductBulkWriter['adjustPrices']>().mockResolvedValue(2),
    delete: vi.fn<ProductBulkWriter['delete']>().mockResolvedValue(2),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new BulkProductActionsService(writer as unknown as ProductBulkWriter, activity);
  return { service, writer, activity };
}

describe('BulkProductActionsService', () => {
  it('sends each product once and reports how many changed', async () => {
    const { service, writer } = setup();

    const result = await service.apply(
      WORKSPACE_ID,
      ['a', 'b', 'a'],
      {
        action: BulkProductAction.SetStatus,
        status: ProductStatus.ARCHIVED,
      },
      ACTOR,
    );

    expect(writer.setStatus).toHaveBeenCalledWith(WORKSPACE_ID, ['a', 'b'], ProductStatus.ARCHIVED);
    expect(result).toEqual({ affected: 2 });
  });

  it('cleans tags the way the editor does before writing them', async () => {
    const { service, writer } = setup();

    await service.apply(
      WORKSPACE_ID,
      ['a'],
      {
        action: BulkProductAction.AddTags,
        tags: [' Summer ', 'summer', '', 'sale'],
      },
      ACTOR,
    );

    expect(writer.addTags).toHaveBeenCalledWith(WORKSPACE_ID, ['a'], ['Summer', 'sale']);
  });

  it('routes price changes and deletes to their writers', async () => {
    const { service, writer } = setup();

    await service.apply(
      WORKSPACE_ID,
      ['a'],
      {
        action: BulkProductAction.AdjustPrices,
        percent: -15,
      },
      ACTOR,
    );
    await service.apply(WORKSPACE_ID, ['a'], { action: BulkProductAction.Delete }, ACTOR);

    expect(writer.adjustPrices).toHaveBeenCalledWith(WORKSPACE_ID, ['a'], -15);
    expect(writer.delete).toHaveBeenCalledWith(WORKSPACE_ID, ['a']);
  });

  it('records one event that every selected product’s history shows', async () => {
    const { service, activity } = setup();

    await service.apply(
      WORKSPACE_ID,
      ['a', 'b'],
      { action: BulkProductAction.AdjustPrices, percent: 10 },
      ACTOR,
    );
    await service.apply(WORKSPACE_ID, ['a'], { action: BulkProductAction.Delete }, ACTOR);

    expect(activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.ProductsBulkUpdated,
        relatedSubjectIds: ['a', 'b'],
        itemCount: 2,
        detail: 'prices +10%',
      }),
      expect.objectContaining({ action: ActivityAction.ProductsBulkDeleted }),
    ]);
  });

  it('records nothing when no product changed', async () => {
    const { service, writer, activity } = setup();
    writer.setStatus.mockResolvedValue(0);

    await service.apply(
      WORKSPACE_ID,
      ['foreign'],
      { action: BulkProductAction.SetStatus, status: ProductStatus.ACTIVE },
      ACTOR,
    );

    expect(activity.recorded).toHaveLength(0);
  });
});
