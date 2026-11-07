import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { SubscriptionOverview } from '../../entitlements/entities/entitlement-check.js';
import type { ProductSummary } from '../../catalog/entities/product-views.js';
import type { ProductChannelView, StoreListingRow } from '../../listings/entities/listing-views.js';
import { UNLIMITED_LABEL } from '../ask.constants.js';

const FACT_LINE = '\n';
const NONE = 'none';
const NOT_SET = 'never';

function when(date: Date | null): string {
  return date ? date.toISOString() : NOT_SET;
}

/** One store a product is (or is not) listed on. */
function productOnStoreLine(view: ProductChannelView): string {
  const listing = view.listing;
  return [
    `- ${view.connection.displayName} (${view.connection.channel}): ${view.displayState}`,
    view.displayReason ? `, why: ${view.displayReason}` : '',
    listing ? `, listing status ${listing.status}` : ', never listed',
    listing?.lastError ? `, last error: ${listing.lastError}` : '',
    listing ? `, last synced ${when(listing.lastSyncedAt)}` : '',
  ].join('');
}

/** A product and where it stands on each store, as facts the model reads. */
export function productListingFacts(
  product: ProductSummary,
  stores: readonly ProductChannelView[],
): string {
  return [
    `Product "${product.title}" (status ${product.status}, ${product.variantCount} variants).`,
    stores.length ? 'On each store:' : 'No store can list it yet.',
    ...stores.map(productOnStoreLine),
  ].join(FACT_LINE);
}

/** The plan, its limits and what is used of each, as facts. */
export function planUsageFacts(overview: SubscriptionOverview): string {
  return [
    `Plan: ${overview.plan.name} (status ${overview.status}, current period ends ${when(overview.currentPeriodEnd)}).`,
    `Limits are ${overview.enforced ? 'enforced' : 'reported only, not enforced'}.`,
    ...overview.features.map((feature) =>
      feature.usage === null
        ? `- ${feature.feature}: ${feature.enabled ? 'included' : 'not included'}`
        : `- ${feature.feature}: ${feature.usage} used of ${feature.limit ?? UNLIMITED_LABEL}`,
    ),
  ].join(FACT_LINE);
}

/** The workspace's store connections and their status, as facts. */
export function connectionFacts(connections: readonly ChannelConnectionView[]): string {
  if (!connections.length) return 'No store is connected.';
  return connections
    .map(
      (connection) =>
        `- ${connection.displayName} (${connection.channel}): ${connection.status}` +
        (connection.statusReason ? `, why: ${connection.statusReason}` : '') +
        `, publishing ${connection.publishReadiness.ready ? 'ready' : 'not ready'}` +
        `, last synced ${when(connection.lastSyncedAt)}`,
    )
    .join(FACT_LINE);
}

/** The latest failed listings, as facts. */
export function failedListingFacts(
  failures: readonly StoreListingRow[],
  connections: readonly ChannelConnectionView[],
): string {
  if (!failures.length) return `Failed listings: ${NONE}.`;
  const names = new Map(connections.map((connection) => [connection.id, connection.displayName]));
  return failures
    .map(
      (failure) =>
        `- "${failure.productTitle}" on ${names.get(failure.connectionId) ?? failure.connectionId}: ` +
        `${failure.lastError ?? failure.displayReason ?? 'no error recorded'} (at ${when(failure.lastSyncedAt)})`,
    )
    .join(FACT_LINE);
}
