import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ListingOverrideInput } from '../entities/listing-override.js';
import {
  CONNECTION_ID,
  type ConnectorDouble,
  PRODUCT_ID,
  productDetail,
  syncConnection,
  VARIANT_ID,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import type { ListingOverrideWriter } from './listing-override.writer.js';
import { ListingOverridesService } from './listing-overrides.service.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';
import type { SyncProductLoader } from './sync-product.loader.js';

const TARGET = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, productId: PRODUCT_ID };
const ACTOR = Actor.user('user-1');
const EMPTY: ListingOverrideInput = {
  title: null,
  descriptionHtml: null,
  tags: null,
  mediaUrls: null,
  visibility: null,
  inventoryBuffer: null,
  maxQuantity: null,
  variantPrices: [],
};

function setup() {
  const products = { find: vi.fn<SyncProductLoader['find']>().mockResolvedValue(productDetail()) };
  const connections = {
    require: vi
      .fn<SyncConnectionLoader['require']>()
      .mockResolvedValue(syncConnection({} as ConnectorDouble)),
  };
  const writer = {
    save: vi.fn<ListingOverrideWriter['save']>().mockResolvedValue(),
    clear: vi.fn<ListingOverrideWriter['clear']>().mockResolvedValue(),
    current: vi.fn<ListingOverrideWriter['current']>().mockResolvedValue({
      ...EMPTY,
      inventoryBuffer: 2,
      descriptionHtml: '<p>Channel copy.</p>',
    }),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new ListingOverridesService(
    connections as unknown as SyncConnectionLoader,
    products as unknown as SyncProductLoader,
    writer as unknown as ListingOverrideWriter,
    activity,
  );
  return { service, products, writer, activity };
}

describe('ListingOverridesService', () => {
  it('saves overrides of the product’s own variants and images, and logs the change', async () => {
    const { service, writer, activity } = setup();
    const input = {
      ...EMPTY,
      mediaUrls: ['https://cdn.example.com/2.jpg'],
      variantPrices: [{ variantId: VARIANT_ID, price: '79.00', compareAtPrice: null }],
    };

    await service.save(TARGET, input, ACTOR);

    expect(writer.save).toHaveBeenCalledWith(TARGET, input);
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ListingOverrideUpdated,
      subject: { id: PRODUCT_ID, label: 'Mug' },
      detail: 'Demo Store',
    });
  });

  it.each([
    [
      'a variant of another product',
      { variantPrices: [{ variantId: 'other', price: '1.00', compareAtPrice: null }] },
    ],
    [
      'one variant twice',
      {
        variantPrices: [
          { variantId: VARIANT_ID, price: '1.00', compareAtPrice: null },
          { variantId: VARIANT_ID, price: '2.00', compareAtPrice: null },
        ],
      },
    ],
    ['an image the product does not have', { mediaUrls: ['https://evil.example.com/x.jpg'] }],
  ])('refuses %s', async (_case, change) => {
    const { service, writer } = setup();

    await expect(service.save(TARGET, { ...EMPTY, ...change }, ACTOR)).rejects.toThrow(
      BadRequestException,
    );
    expect(writer.save).not.toHaveBeenCalled();
  });

  it('is not found for a product outside the workspace', async () => {
    const { service, products } = setup();
    products.find.mockResolvedValue(null);

    await expect(service.clear(TARGET, ACTOR)).rejects.toThrow(NotFoundException);
  });

  it('changes only the given content fields and keeps every other override', async () => {
    const { service, writer, activity } = setup();

    await service.saveContent(TARGET, { title: 'Stoneware Mug' }, ACTOR);

    expect(writer.save).toHaveBeenCalledWith(TARGET, {
      ...EMPTY,
      title: 'Stoneware Mug',
      descriptionHtml: '<p>Channel copy.</p>',
      inventoryBuffer: 2,
    });
    expect(activity.entries[0].action).toBe(ActivityAction.ListingOverrideUpdated);
  });
});
