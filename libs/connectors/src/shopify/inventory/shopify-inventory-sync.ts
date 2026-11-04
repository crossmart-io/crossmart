import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  InventoryQuantityUpdate,
  InventorySync,
  InventoryUpdateFailure,
} from '../../sdk/capabilities/inventory-sync.js';
import {
  INVENTORY_SET_QUANTITIES_MUTATION,
  type InventorySetQuantityInput,
} from '../graphql/inventory-set-quantities.mutation.js';
import {
  INVENTORY_LEVELS_QUERY,
  type InventoryLevelsData,
} from '../graphql/inventory-levels.query.js';
import { ShopifyAdminClient } from '../graphql/shopify-admin.client.js';
import type { ShopifyUserError } from '../graphql/shopify-user-error.js';
import {
  SHOPIFY_AVAILABLE_QUANTITY_NAME,
  SHOPIFY_INVENTORY_BATCH_SIZE,
  SHOPIFY_INVENTORY_REASON,
} from '../shopify.constants.js';
import { ShopifyLocations } from './shopify-locations.js';

const NO_LOCATION = 'The store has no location to hold stock';

/** The `available` quantity of each item stocked at the location. */
function availableQuantities(nodes: InventoryLevelsData['nodes']): [string, number][] {
  return nodes.flatMap((node) => {
    const available = node?.inventoryLevel?.quantities.find(
      ({ name }) => name === SHOPIFY_AVAILABLE_QUANTITY_NAME,
    );
    return node && available ? [[node.id, available.quantity] as [string, number]] : [];
  });
}
/** `field` paths look like ["input", "quantities", "3", "inventoryItemId"]. */
const QUANTITY_INDEX_POSITION = 2;

/**
 * Sets available quantities with `inventorySetQuantities`, up to 250 items per call, at the
 * primary location unless an update names another. Shopify applies a call's valid items; a
 * user error that points at one item fails that item, any other fails the whole batch.
 */
@Injectable()
export class ShopifyInventorySync implements InventorySync {
  readonly maxBatchSize = SHOPIFY_INVENTORY_BATCH_SIZE;

  constructor(
    private readonly admin: ShopifyAdminClient,
    private readonly locations: ShopifyLocations,
  ) {}

  async setQuantities(
    session: ChannelSession,
    updates: readonly InventoryQuantityUpdate[],
  ): Promise<InventoryUpdateFailure[]> {
    const failures: InventoryUpdateFailure[] = [];
    for (let start = 0; start < updates.length; start += this.maxBatchSize) {
      const batch = updates.slice(start, start + this.maxBatchSize);
      failures.push(...(await this.setBatch(session, batch)));
    }
    return failures;
  }

  /** Reads up to `maxBatchSize` items per call, at the primary location. */
  async readQuantities(
    session: ChannelSession,
    externalInventoryIds: readonly string[],
  ): Promise<Map<string, number>> {
    const quantities = new Map<string, number>();
    const locationId = await this.locations.primaryLocationId(session);
    if (!locationId) return quantities;
    for (let start = 0; start < externalInventoryIds.length; start += this.maxBatchSize) {
      const ids = externalInventoryIds.slice(start, start + this.maxBatchSize);
      const { nodes } = await this.admin.request(session, INVENTORY_LEVELS_QUERY, {
        ids,
        locationId,
      });
      for (const [id, quantity] of availableQuantities(nodes)) quantities.set(id, quantity);
    }
    return quantities;
  }

  private async setBatch(
    session: ChannelSession,
    batch: readonly InventoryQuantityUpdate[],
  ): Promise<InventoryUpdateFailure[]> {
    const primaryLocationId = await this.locations.primaryLocationId(session);
    const quantities = this.toQuantities(batch, primaryLocationId);
    if (quantities === null) {
      return batch.map(({ externalInventoryId }) => ({
        externalInventoryId,
        message: NO_LOCATION,
      }));
    }
    const { inventorySetQuantities } = await this.admin.request(
      session,
      INVENTORY_SET_QUANTITIES_MUTATION,
      {
        input: {
          name: SHOPIFY_AVAILABLE_QUANTITY_NAME,
          reason: SHOPIFY_INVENTORY_REASON,
          quantities,
        },
        idempotencyKey: randomUUID(),
      },
    );
    return this.toFailures(batch, inventorySetQuantities.userErrors);
  }

  /** Null when an update has no location and the store has no primary location. */
  private toQuantities(
    batch: readonly InventoryQuantityUpdate[],
    primaryLocationId: string | null,
  ): InventorySetQuantityInput[] | null {
    const quantities: InventorySetQuantityInput[] = [];
    for (const update of batch) {
      const locationId = update.externalLocationId ?? primaryLocationId;
      if (!locationId) return null;
      quantities.push({
        inventoryItemId: update.externalInventoryId,
        locationId,
        quantity: Math.max(update.available, 0),
        changeFromQuantity: null,
      });
    }
    return quantities;
  }

  private toFailures(
    batch: readonly InventoryQuantityUpdate[],
    errors: readonly ShopifyUserError[],
  ): InventoryUpdateFailure[] {
    const failures = new Map<string, string>();
    for (const error of errors) {
      const index = Number(error.field?.[QUANTITY_INDEX_POSITION]);
      const targets = Number.isInteger(index) && batch[index] ? [batch[index]] : batch;
      for (const { externalInventoryId } of targets) {
        failures.set(externalInventoryId, error.message);
      }
    }
    return [...failures].map(([externalInventoryId, message]) => ({
      externalInventoryId,
      message,
    }));
  }
}
