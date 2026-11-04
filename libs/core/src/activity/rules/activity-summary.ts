import { ActivityOutcome } from '@crossmart/database';
import type { ActivityEntry } from '../entities/activity-entry.js';
import { ActivityAction } from '../enums/activity-action.enum.js';

interface ActionWording {
  /** Names the operation in a failure: "Product import failed". */
  operation: string;
  describe: (entry: ActivityEntry) => string;
}

interface Noun {
  one: string;
  other: string;
}

const PRODUCT_NOUN: Noun = { one: 'product', other: 'products' };
const VARIANT_NOUN: Noun = { one: 'variant', other: 'variants' };
const pluralRules = new Intl.PluralRules('en');

function countOf(noun: Noun, entry: ActivityEntry): string {
  const count = entry.itemCount ?? 0;
  return `${count} ${pluralRules.select(count) === 'one' ? noun.one : noun.other}`;
}

function countOfProducts(entry: ActivityEntry): string {
  return countOf(PRODUCT_NOUN, entry);
}

/** Names the imported file, which is the label of an import's subject. */
function fromFile(entry: ActivityEntry): string {
  return entry.subject?.label ? ` from “${entry.subject.label}”` : '';
}

function named(entry: ActivityEntry): string {
  return entry.subject?.label ? ` “${entry.subject.label}”` : '';
}

function withDetail(text: string, entry: ActivityEntry): string {
  return entry.detail ? `${text}: ${entry.detail}` : text;
}

/** The channel an event is about ("Shopify"), which channel events pass as their detail. */
function channelOf(entry: ActivityEntry): string {
  return entry.detail ?? 'a channel';
}

/** The store a listing event is about ("Demo Store"), which listing events pass as their detail. */
function onStore(entry: ActivityEntry): string {
  return entry.detail ? ` on ${entry.detail}` : '';
}

/** One entry per action, so adding an action without its wording does not compile. */
const ACTION_WORDING: Record<ActivityAction, ActionWording> = {
  [ActivityAction.ProductCreated]: {
    operation: 'Product creation',
    describe: (entry) => `Created product${named(entry)}`,
  },
  [ActivityAction.ProductUpdated]: {
    operation: 'Product update',
    describe: (entry) => `Updated product${named(entry)}`,
  },
  [ActivityAction.ProductDeleted]: {
    operation: 'Product deletion',
    describe: (entry) => `Deleted product${named(entry)}`,
  },
  [ActivityAction.ProductsBulkUpdated]: {
    operation: 'Bulk edit',
    describe: (entry) => withDetail(`Bulk edited ${countOfProducts(entry)}`, entry),
  },
  [ActivityAction.ProductsBulkDeleted]: {
    operation: 'Bulk delete',
    describe: (entry) => `Deleted ${countOfProducts(entry)}`,
  },
  [ActivityAction.ProductsImported]: {
    operation: 'Product import',
    describe: (entry) => withDetail(`Imported ${countOfProducts(entry)}${fromFile(entry)}`, entry),
  },
  [ActivityAction.ProductsUpdatedByImport]: {
    operation: 'Product update import',
    describe: (entry) => withDetail(`Updated ${countOfProducts(entry)}${fromFile(entry)}`, entry),
  },
  [ActivityAction.StockImported]: {
    operation: 'Stock import',
    describe: (entry) =>
      withDetail(`Set stock of ${countOf(VARIANT_NOUN, entry)}${fromFile(entry)}`, entry),
  },
  [ActivityAction.ChannelCatalogImported]: {
    operation: 'Channel import',
    describe: (entry) =>
      withDetail(
        entry.itemCount
          ? `Imported ${countOfProducts(entry)}${fromFile(entry)}`
          : `Read the catalog${fromFile(entry)}`,
        entry,
      ),
  },
  [ActivityAction.ProductViewCreated]: {
    operation: 'Saving a view',
    describe: (entry) => `Saved view${named(entry)}`,
  },
  [ActivityAction.ProductViewDeleted]: {
    operation: 'Deleting a view',
    describe: (entry) => `Deleted view${named(entry)}`,
  },
  [ActivityAction.ApiKeyCreated]: {
    operation: 'API key creation',
    describe: (entry) => `Created API key${named(entry)}`,
  },
  [ActivityAction.ApiKeyRevoked]: {
    operation: 'API key revocation',
    describe: (entry) => `Revoked API key${named(entry)}`,
  },
  [ActivityAction.InventoryAdjusted]: {
    operation: 'Stock adjustment',
    describe: (entry) => withDetail(`Adjusted stock of${named(entry)}`, entry),
  },
  [ActivityAction.ChannelConnected]: {
    operation: 'Connecting a channel',
    describe: (entry) => `Connected ${channelOf(entry)}${named(entry)}`,
  },
  [ActivityAction.ChannelDisconnected]: {
    operation: 'Disconnecting a channel',
    describe: (entry) => `Disconnected ${channelOf(entry)}${named(entry)}`,
  },
  [ActivityAction.ChannelConnectFailed]: {
    operation: 'Connecting a channel',
    describe: (entry) => `Could not connect ${channelOf(entry)}${named(entry)}`,
  },
  [ActivityAction.ListingPublished]: {
    operation: 'Publishing a listing',
    describe: (entry) => `Published${named(entry)}${onStore(entry)}`,
  },
  [ActivityAction.ListingUpdated]: {
    operation: 'Updating a listing',
    describe: (entry) => `Updated the listing of${named(entry)}${onStore(entry)}`,
  },
  [ActivityAction.StockOversold]: {
    operation: 'Reserving an order’s stock',
    describe: (entry) => withDetail(`Oversold${named(entry)}`, entry),
  },
  [ActivityAction.ListingSyncFailed]: {
    operation: 'Syncing a listing',
    describe: (entry) => `Could not sync${named(entry)}${onStore(entry)}`,
  },
  [ActivityAction.ListingDelisted]: {
    operation: 'Delisting',
    describe: (entry) => `Delisted${named(entry)}${onStore(entry)}`,
  },
  [ActivityAction.ListingAdded]: {
    operation: 'Adding a product to a store',
    describe: (entry) => `Added${named(entry)} to ${entry.detail ?? 'a store'}`,
  },
  [ActivityAction.ListingRemoved]: {
    operation: 'Removing a product from a store',
    describe: (entry) => `Removed${named(entry)} from ${entry.detail ?? 'a store'}`,
  },
  [ActivityAction.ListingOverrideUpdated]: {
    operation: 'Saving channel overrides',
    describe: (entry) => `Changed the channel overrides of${named(entry)}${onStore(entry)}`,
  },
  [ActivityAction.ChannelPricingUpdated]: {
    operation: 'Saving a pricing rule',
    describe: (entry) => withDetail(`Changed the pricing rule of${named(entry)}`, entry),
  },
  [ActivityAction.ChannelSelectionUpdated]: {
    operation: 'Saving a product selection',
    describe: (entry) => withDetail(`Changed the products listed on${named(entry)}`, entry),
  },
  [ActivityAction.ChannelSyncRequested]: {
    operation: 'Starting a sync',
    describe: (entry) => withDetail(`Started a sync of${named(entry)}`, entry),
  },
};

/** The one-line, human-readable text of an event, as stored and shown in the log. */
export function summarizeActivity(entry: ActivityEntry): string {
  const wording = ACTION_WORDING[entry.action];
  return entry.outcome === ActivityOutcome.FAILED
    ? `${wording.operation} failed`
    : wording.describe(entry);
}
