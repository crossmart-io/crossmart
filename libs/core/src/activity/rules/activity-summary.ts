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
const SUGGESTION_NOUN: Noun = { one: 'suggestion', other: 'suggestions' };
const UNUSED_AGENT_NOUN: Noun = { one: 'unused agent', other: 'unused agents' };
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
  [ActivityAction.WebhookEndpointCreated]: {
    operation: 'Webhook endpoint creation',
    describe: (entry) => `Added webhook endpoint${named(entry)}`,
  },
  [ActivityAction.WebhookEndpointUpdated]: {
    operation: 'Webhook endpoint update',
    describe: (entry) => withDetail(`Updated webhook endpoint${named(entry)}`, entry),
  },
  [ActivityAction.WebhookEndpointDeleted]: {
    operation: 'Deleting a webhook endpoint',
    describe: (entry) => `Deleted webhook endpoint${named(entry)}`,
  },
  [ActivityAction.WebhookSecretRotated]: {
    operation: 'Webhook secret rotation',
    describe: (entry) => `Rotated the signing secret of webhook endpoint${named(entry)}`,
  },
  [ActivityAction.WebhookEndpointDisabled]: {
    operation: 'Webhook delivery',
    describe: (entry) => withDetail(`Turned off webhook endpoint${named(entry)}`, entry),
  },
  [ActivityAction.AgentDisconnected]: {
    operation: 'Disconnecting an agent',
    describe: (entry) => `Disconnected agent${named(entry)}`,
  },
  [ActivityAction.UnusedAgentsRemoved]: {
    operation: 'Removing unused agents',
    describe: (entry) => withDetail(`Removed ${countOf(UNUSED_AGENT_NOUN, entry)}`, entry),
  },
  [ActivityAction.MemberInvited]: {
    operation: 'Invitation',
    describe: (entry) => withDetail(`Invited${named(entry)}`, entry),
  },
  [ActivityAction.InvitationRevoked]: {
    operation: 'Revoking an invitation',
    describe: (entry) => `Revoked the invitation of${named(entry)}`,
  },
  [ActivityAction.MemberJoined]: {
    operation: 'Joining the workspace',
    describe: (entry) => withDetail(`${entry.subject?.label ?? 'A member'} joined`, entry),
  },
  [ActivityAction.MemberRoleChanged]: {
    operation: 'Changing a role',
    describe: (entry) => withDetail(`Changed the role of${named(entry)}`, entry),
  },
  [ActivityAction.MemberRemoved]: {
    operation: 'Removing a member',
    describe: (entry) => `Removed${named(entry)} from the workspace`,
  },
  [ActivityAction.MemberLeft]: {
    operation: 'Leaving the workspace',
    describe: (entry) => `${entry.subject?.label ?? 'A member'} left the workspace`,
  },
  [ActivityAction.WorkspaceCreated]: {
    operation: 'Creating the workspace',
    describe: (entry) => `Created the workspace${named(entry)}`,
  },
  [ActivityAction.WorkspaceRenamed]: {
    operation: 'Renaming the workspace',
    describe: (entry) =>
      entry.detail
        ? `Renamed the workspace from “${entry.detail}” to “${entry.subject?.label ?? ''}”`
        : `Renamed the workspace${named(entry)}`,
  },
  [ActivityAction.WorkspaceTimeZoneChanged]: {
    operation: 'Changing the time zone',
    describe: (entry) => withDetail('Changed the time zone', entry),
  },
  [ActivityAction.CustomRoleCreated]: {
    operation: 'Creating a role',
    describe: (entry) => `Created the role${named(entry)}`,
  },
  [ActivityAction.CustomRoleUpdated]: {
    operation: 'Changing a role',
    describe: (entry) => `Changed the role${named(entry)}`,
  },
  [ActivityAction.CustomRoleDeleted]: {
    operation: 'Deleting a role',
    describe: (entry) => `Deleted the role${named(entry)}`,
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
  [ActivityAction.ChannelListingDefaultsUpdated]: {
    operation: 'Saving listing defaults',
    describe: (entry) => `Changed the listing defaults of${named(entry)}`,
  },
  [ActivityAction.ChannelPoliciesOptedIn]: {
    operation: 'Opting in to business policies',
    describe: (entry) => `Opted${named(entry)} in to eBay business policies`,
  },
  [ActivityAction.ChannelDefaultPoliciesCreated]: {
    operation: 'Creating default business policies',
    describe: (entry) => `Created default eBay business policies for${named(entry)}`,
  },
  [ActivityAction.ListingCategoryChanged]: {
    operation: 'Choosing a channel category',
    describe: (entry) => `Changed the channel category of${named(entry)}${onStore(entry)}`,
  },
  [ActivityAction.ListingRetryRequested]: {
    operation: 'Retrying a listing',
    describe: (entry) => `Asked to publish${named(entry)} again${onStore(entry)}`,
  },
  [ActivityAction.ListingItemSpecificsChanged]: {
    operation: 'Setting item specifics',
    describe: (entry) => `Changed the item specifics of${named(entry)}${onStore(entry)}`,
  },
  [ActivityAction.ChannelSyncRequested]: {
    operation: 'Starting a sync',
    describe: (entry) => withDetail(`Started a sync of${named(entry)}`, entry),
  },
  [ActivityAction.ContentGenerationRequested]: {
    operation: 'Requesting AI content',
    describe: (entry) => `Asked AI to write content for ${countOfProducts(entry)}${onStore(entry)}`,
  },
  [ActivityAction.ContentGenerated]: {
    operation: 'Generating AI content',
    describe: (entry) => `AI suggested new content for${named(entry)}${onStore(entry)}`,
  },
  [ActivityAction.SuggestionApproved]: {
    operation: 'Approving a suggestion',
    describe: (entry) => withDetail(`Approved a suggestion for${named(entry)}`, entry),
  },
  [ActivityAction.SuggestionRejected]: {
    operation: 'Rejecting a suggestion',
    describe: (entry) => withDetail(`Rejected a suggestion for${named(entry)}`, entry),
  },
  [ActivityAction.SuggestionsBulkApproved]: {
    operation: 'Approving suggestions',
    describe: (entry) => `Approved ${countOf(SUGGESTION_NOUN, entry)}`,
  },
};

/** The one-line, human-readable text of an event, as stored and shown in the log. */
export function summarizeActivity(entry: ActivityEntry): string {
  const wording = ACTION_WORDING[entry.action];
  return entry.outcome === ActivityOutcome.FAILED
    ? `${wording.operation} failed`
    : wording.describe(entry);
}
