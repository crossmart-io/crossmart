import { ProductStatus } from '@crossmart/database';
import { BulkProductAction } from '../enums/bulk-product-action.enum.js';
import type { ProductBulkWriter } from '../repositories/product-bulk.writer.js';
import { BulkProductActionsService } from './bulk-product-actions.service.js';

const WORKSPACE_ID = 'ws-1';

function setup() {
  const writer = {
    setStatus: vi.fn<ProductBulkWriter['setStatus']>().mockResolvedValue(2),
    addTags: vi.fn<ProductBulkWriter['addTags']>().mockResolvedValue(2),
    removeTags: vi.fn<ProductBulkWriter['removeTags']>().mockResolvedValue(2),
    adjustPrices: vi.fn<ProductBulkWriter['adjustPrices']>().mockResolvedValue(2),
    delete: vi.fn<ProductBulkWriter['delete']>().mockResolvedValue(2),
  };
  const service = new BulkProductActionsService(writer as unknown as ProductBulkWriter);
  return { service, writer };
}

describe('BulkProductActionsService', () => {
  it('sends each product once and reports how many changed', async () => {
    const { service, writer } = setup();

    const result = await service.apply(WORKSPACE_ID, ['a', 'b', 'a'], {
      action: BulkProductAction.SetStatus,
      status: ProductStatus.ARCHIVED,
    });

    expect(writer.setStatus).toHaveBeenCalledWith(WORKSPACE_ID, ['a', 'b'], ProductStatus.ARCHIVED);
    expect(result).toEqual({ affected: 2 });
  });

  it('cleans tags the way the editor does before writing them', async () => {
    const { service, writer } = setup();

    await service.apply(WORKSPACE_ID, ['a'], {
      action: BulkProductAction.AddTags,
      tags: [' Summer ', 'summer', '', 'sale'],
    });

    expect(writer.addTags).toHaveBeenCalledWith(WORKSPACE_ID, ['a'], ['Summer', 'sale']);
  });

  it('routes price changes and deletes to their writers', async () => {
    const { service, writer } = setup();

    await service.apply(WORKSPACE_ID, ['a'], {
      action: BulkProductAction.AdjustPrices,
      percent: -15,
    });
    await service.apply(WORKSPACE_ID, ['a'], { action: BulkProductAction.Delete });

    expect(writer.adjustPrices).toHaveBeenCalledWith(WORKSPACE_ID, ['a'], -15);
    expect(writer.delete).toHaveBeenCalledWith(WORKSPACE_ID, ['a']);
  });
});
