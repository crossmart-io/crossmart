import { Injectable } from '@nestjs/common';
import { chunk } from '@crossmart/common';
import {
  ChannelCapability,
  type ChannelSession,
  type InventoryQuantityUpdate,
  type InventorySync,
  type InventoryUpdateFailure,
  supportsCapability,
} from '@crossmart/connectors';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import type { ListingStockRecord } from '../repositories/listing-sync.queries.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { effectiveQuantity } from '../rules/effective-quantity.js';
import type { FailedListing } from './listing-sync-failures.js';
import { ListingSyncOutcomes } from './listing-sync-outcomes.js';
import { type SyncConnection, SyncConnectionLoader } from './sync-connection.loader.js';

/** The quantity each tracked variant shows on the channel: available, minus the buffer, capped. */
function toQuantityUpdates(listing: ListingStockRecord): InventoryQuantityUpdate[] {
  return listing.variants.flatMap(({ externalInventoryId, variant }) => {
    const item = variant.inventoryItem;
    if (!externalInventoryId || !item?.tracked) return [];
    return [
      { externalInventoryId, available: effectiveQuantity(item.available, listing.override) },
    ];
  });
}

/** The updates whose quantity the channel does not show already, when it can say. */
async function driftedOnly(
  connector: InventorySync,
  session: ChannelSession,
  updates: InventoryQuantityUpdate[],
): Promise<InventoryQuantityUpdate[]> {
  if (!connector.readQuantities) return updates;
  const shown = await connector.readQuantities(
    session,
    updates.map(({ externalInventoryId }) => externalInventoryId),
  );
  return updates.filter(
    ({ externalInventoryId, available }) =>
      shown.get(externalInventoryId) !== Math.max(available, 0),
  );
}

/** Sends the quantities in batches the connector accepts; returns the items it rejected. */
async function setInBatches(
  connector: InventorySync,
  session: ChannelSession,
  updates: InventoryQuantityUpdate[],
): Promise<InventoryUpdateFailure[]> {
  const failures: InventoryUpdateFailure[] = [];
  for (const batch of chunk(updates, connector.maxBatchSize)) {
    failures.push(...(await connector.setQuantities(session, batch)));
  }
  return failures;
}

/** A connection that can set stock, with its connector typed for it. */
type StockConnection = SyncConnection & { connector: InventorySync };

/**
 * Sets a listing's stock on its channel, in batches of the connector's `maxBatchSize`. Items
 * the channel rejects are reported on the listing; the rest are applied. Reconciliation jobs
 * send only what the channel shows wrongly, and log what they corrected.
 */
@Injectable()
export class ListingInventorySync {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly listings: ListingSyncRepository,
    private readonly outcomes: ListingSyncOutcomes,
  ) {}

  async run(job: ListingSyncJob): Promise<void> {
    const connection = await this.connections.load(job.workspaceId, job.connectionId);
    if (
      !connection ||
      !supportsCapability(connection.connector, ChannelCapability.UpdateInventory)
    ) {
      return;
    }
    const listing = await this.listings.findPrimaryStock(
      job.workspaceId,
      job.connectionId,
      job.productId,
    );
    const updates = listing ? toQuantityUpdates(listing) : [];
    if (!listing || updates.length === 0) return;
    const store = this.describe(job, listing, connection.view.displayName);
    try {
      await this.send(job, { ...connection, connector: connection.connector }, listing, updates);
    } catch (error) {
      await this.outcomes.failed(store, error);
    }
  }

  /** Sends the quantities (only the drifted ones when reconciling) and records how it went. */
  private async send(
    job: ListingSyncJob,
    connection: StockConnection,
    listing: ListingStockRecord,
    updates: InventoryQuantityUpdate[],
  ): Promise<void> {
    const { connector } = connection;
    const session = await this.connections.openSession(job.workspaceId, job.connectionId);
    const pending = job.reconcile ? await driftedOnly(connector, session, updates) : updates;
    const [firstFailure] = await setInBatches(connector, session, pending);
    const store = this.describe(job, listing, connection.view.displayName);
    if (firstFailure) {
      await this.outcomes.stockPartlyFailed(store, firstFailure.message, listing.lastError);
    } else if (job.reconcile && pending.length > 0) {
      await this.outcomes.reconciled(store, pending.length);
    } else {
      await this.outcomes.synced(store);
    }
  }

  private describe(
    job: ListingSyncJob,
    listing: ListingStockRecord,
    storeName: string,
  ): FailedListing {
    return {
      workspaceId: job.workspaceId,
      connectionId: job.connectionId,
      listingId: listing.id,
      productId: job.productId,
      productTitle: listing.product.title,
      storeName,
    };
  }
}
