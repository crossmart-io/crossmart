import {
  ChannelCapability,
  type ChannelConnector,
  type ChannelConnectorRegistry,
  ChannelType,
} from '@crossmart/connectors';
import type { ProductChannelView } from '../entities/listing-views.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import {
  CONNECTION_ID,
  connectionView,
  listingRecord,
  PRODUCT_ID,
  productDetail,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { ListingEditorService } from './listing-editor.service.js';
import { ListingEditorViews } from './listing-editor.views.js';
import type { ProductChannelViews } from './product-channel.views.js';
import type { ProductChannelsService } from './product-channels.service.js';

function setup(capabilities: ChannelCapability[]) {
  const connection = connectionView({ channel: ChannelType.Ebay });
  const loaded = { product: productDetail(), connection, listing: listingRecord() };
  const channels = { load: vi.fn<ProductChannelsService['load']>().mockResolvedValue(loaded) };
  const channelView: ProductChannelView = {
    connection: { ...connection, currencyCode: 'USD' },
    selected: true,
    displayState: ListingDisplayState.Publishing,
    displayReason: null,
    displayRequirement: null,
    listing: null,
    override: null,
    variants: [],
  };
  const channelViews = {
    build: vi.fn<ProductChannelViews['build']>().mockResolvedValue(channelView),
  };
  const connector = { capabilities: new Set(capabilities) };
  const registry = { require: vi.fn(() => connector as unknown as ChannelConnector) };
  const service = new ListingEditorService(
    channels as unknown as ProductChannelsService,
    new ListingEditorViews(
      channelViews as unknown as ProductChannelViews,
      registry as unknown as ChannelConnectorRegistry,
    ),
  );
  return { service, channels, channelViews, loaded };
}

describe('ListingEditorService', () => {
  it('builds the editor on the store view of the product’s listing', async () => {
    const { service, channels, channelViews, loaded } = setup([ChannelCapability.ProvideTaxonomy]);

    const view = await service.get(WORKSPACE_ID, PRODUCT_ID, CONNECTION_ID);

    expect(channels.load).toHaveBeenCalledWith(WORKSPACE_ID, PRODUCT_ID, CONNECTION_ID);
    expect(channelViews.build).toHaveBeenCalledWith(
      WORKSPACE_ID,
      loaded.product,
      loaded.connection,
      loaded.listing,
    );
    expect(view.displayState).toBe(ListingDisplayState.Publishing);
    expect(view.category.supported).toBe(true);
  });

  it('says categories are not supported on channels without a taxonomy', async () => {
    const { service } = setup([ChannelCapability.PublishListings]);

    const view = await service.get(WORKSPACE_ID, PRODUCT_ID, CONNECTION_ID);

    expect(view.category).toEqual({ supported: false, value: null });
    expect(view.itemSpecifics.supported).toBe(false);
  });
});
