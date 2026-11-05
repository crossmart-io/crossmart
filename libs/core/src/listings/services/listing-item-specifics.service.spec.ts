import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CategoryAspectMode,
  CategoryAspectUsage,
  ChannelCapability,
  type ChannelSession,
} from '@crossmart/connectors';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { StoredItemSpecifics } from '../entities/listing-item-specifics.js';
import {
  CONNECTION_ID,
  type ConnectorDouble,
  PRODUCT_ID,
  productDetail,
  syncConnection,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { ListingItemSpecificsService } from './listing-item-specifics.service.js';
import type { ListingItemSpecificsWriter } from './listing-item-specifics.writer.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';
import type { SyncProductLoader } from './sync-product.loader.js';

const TARGET = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, productId: PRODUCT_ID };
const CATEGORY = { id: '20625', name: 'Home & Garden > Mugs' };
const MATERIAL = {
  name: 'Material',
  required: true,
  usage: CategoryAspectUsage.Recommended,
  mode: CategoryAspectMode.FreeText,
  multiple: false,
  values: ['Stoneware', 'Porcelain'],
};
const ACTOR = Actor.user('user-1');

interface SetupOptions {
  capabilities?: ChannelCapability[];
  stored?: StoredItemSpecifics;
}

function setup({
  capabilities = [ChannelCapability.ProvideTaxonomy],
  stored = { category: CATEGORY, values: [{ name: 'Material', values: ['Stoneware'] }] },
}: SetupOptions = {}) {
  const categoryAspects = vi.fn().mockResolvedValue([MATERIAL]);
  const connector = {
    capabilities: new Set(capabilities),
    categoryAspects,
  } as unknown as ConnectorDouble;
  const connections = {
    require: vi.fn<SyncConnectionLoader['require']>().mockResolvedValue(syncConnection(connector)),
    openSession: vi
      .fn<SyncConnectionLoader['openSession']>()
      .mockResolvedValue({} as ChannelSession),
  };
  const products = { find: vi.fn<SyncProductLoader['find']>().mockResolvedValue(productDetail()) };
  const writer = {
    current: vi.fn<ListingItemSpecificsWriter['current']>().mockResolvedValue(stored),
    save: vi.fn<ListingItemSpecificsWriter['save']>().mockResolvedValue(),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new ListingItemSpecificsService(
    connections as unknown as SyncConnectionLoader,
    products as unknown as SyncProductLoader,
    writer as unknown as ListingItemSpecificsWriter,
    activity,
  );
  return { service, categoryAspects, products, writer, activity };
}

describe('ListingItemSpecificsService', () => {
  it('answers the category’s aspects with the values the merchant set', async () => {
    const { service, categoryAspects } = setup();

    const view = await service.get(TARGET);

    expect(categoryAspects).toHaveBeenCalledWith({}, CATEGORY.id);
    expect(view).toEqual({
      category: CATEGORY,
      aspects: [MATERIAL],
      values: [{ name: 'Material', values: ['Stoneware'] }],
    });
  });

  it('reads no aspects until the listing has a category', async () => {
    const { service, categoryAspects } = setup({ stored: { category: null, values: [] } });

    expect(await service.get(TARGET)).toEqual({ category: null, aspects: [], values: [] });
    expect(categoryAspects).not.toHaveBeenCalled();
  });

  it('saves trimmed item specifics without blank ones, and logs it', async () => {
    const { service, writer, activity } = setup();

    await service.save(
      TARGET,
      [
        { name: ' Color ', values: ['Blue', ' Blue ', ''] },
        { name: 'Features', values: [] },
      ],
      ACTOR,
    );

    expect(writer.save).toHaveBeenCalledWith(TARGET, [{ name: 'Color', values: ['Blue'] }]);
    expect(activity.entries[0]?.action).toBe(ActivityAction.ListingItemSpecificsChanged);
  });

  it('refuses an item specific given twice', async () => {
    const { service, writer } = setup();
    const specifics = [
      { name: 'Color', values: ['Blue'] },
      { name: 'color', values: ['Red'] },
    ];

    await expect(service.save(TARGET, specifics, ACTOR)).rejects.toThrow(
      'Set each item specific once: color',
    );
    expect(writer.save).not.toHaveBeenCalled();
  });

  it('refuses channels without categories, and products that do not exist', async () => {
    const withoutTaxonomy = setup({ capabilities: [] });
    await expect(withoutTaxonomy.service.get(TARGET)).rejects.toBeInstanceOf(BadRequestException);
    await expect(withoutTaxonomy.service.save(TARGET, [], ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    const missing = setup();
    missing.products.find.mockResolvedValue(null);
    await expect(missing.service.get(TARGET)).rejects.toBeInstanceOf(NotFoundException);
  });
});
