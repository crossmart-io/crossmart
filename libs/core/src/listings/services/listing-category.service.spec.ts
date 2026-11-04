import { BadRequestException } from '@nestjs/common';
import { ChannelCapability, type ChannelSession } from '@crossmart/connectors';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import {
  CONNECTION_ID,
  type ConnectorDouble,
  PRODUCT_ID,
  productDetail,
  syncConnection,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import type { ListingCategoryWriter } from './listing-category.writer.js';
import { ListingCategoryService } from './listing-category.service.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';
import type { SyncProductLoader } from './sync-product.loader.js';

const TARGET = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, productId: PRODUCT_ID };
const CATEGORY = { id: '20625', name: 'Home & Garden > Mugs' };

function setup(capabilities: ChannelCapability[] = [ChannelCapability.ProvideTaxonomy]) {
  const suggestCategories = vi.fn().mockResolvedValue([CATEGORY]);
  const connector = {
    capabilities: new Set(capabilities),
    suggestCategories,
  } as unknown as ConnectorDouble;
  const connections = {
    require: vi.fn<SyncConnectionLoader['require']>().mockResolvedValue(syncConnection(connector)),
    openSession: vi
      .fn<SyncConnectionLoader['openSession']>()
      .mockResolvedValue({} as ChannelSession),
  };
  const products = { find: vi.fn<SyncProductLoader['find']>().mockResolvedValue(productDetail()) };
  const writer = { save: vi.fn<ListingCategoryWriter['save']>().mockResolvedValue() };
  const activity = new InMemoryActivityRecorder();
  const service = new ListingCategoryService(
    connections as unknown as SyncConnectionLoader,
    products as unknown as SyncProductLoader,
    writer as unknown as ListingCategoryWriter,
    activity,
  );
  return { service, suggestCategories, writer, activity };
}

describe('ListingCategoryService', () => {
  it('suggests categories for the query, or for the product’s title', async () => {
    const { service, suggestCategories } = setup();

    expect(await service.suggest(TARGET, 'coffee cup')).toEqual([CATEGORY]);
    await service.suggest(TARGET, '  ');

    expect(suggestCategories).toHaveBeenNthCalledWith(1, {}, 'coffee cup');
    expect(suggestCategories).toHaveBeenNthCalledWith(2, {}, 'Mug');
  });

  it('saves the chosen category and logs it', async () => {
    const { service, writer, activity } = setup();

    await service.choose(TARGET, CATEGORY, Actor.user('user-1'));

    expect(writer.save).toHaveBeenCalledWith(TARGET, CATEGORY);
    expect(activity.entries[0]?.action).toBe(ActivityAction.ListingCategoryChanged);
  });

  it('refuses channels without categories', async () => {
    const { service, writer } = setup([]);

    await expect(service.suggest(TARGET)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.choose(TARGET, null, Actor.user('user-1'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(writer.save).not.toHaveBeenCalled();
  });
});
