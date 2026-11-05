import { Injectable } from '@nestjs/common';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { ActiveListingsGate } from './active-listings.gate.js';
import { ConnectionRulesService } from './connection-rules.service.js';
import { SyncJobQueue } from './sync-job.queue.js';

/** Products of one store that the merchant adds or removes by hand. */
export interface StoreMembershipChange {
  workspaceId: string;
  connectionId: string;
  productIds: string[];
}

function jobs(change: StoreMembershipChange, kinds: ListingSyncJob['kind'][]): ListingSyncJob[] {
  const { workspaceId, connectionId } = change;
  return change.productIds.flatMap((productId) =>
    kinds.map((kind) => ({ kind, workspaceId, connectionId, productId })),
  );
}

/** Writes a membership change: the listings, the hand-removed list, and the sync jobs. */
@Injectable()
export class StoreMembershipWriter {
  constructor(
    private readonly listings: ListingSyncRepository,
    private readonly rules: ConnectionRulesService,
    private readonly queue: SyncJobQueue,
    private readonly gate: ActiveListingsGate,
  ) {}

  /**
   * Keeps the products in the store and publishes them with their stock. Refused whole, before
   * any write, when the plan has no room for the active listings they would add.
   */
  async add(change: StoreMembershipChange): Promise<void> {
    const { workspaceId, connectionId, productIds } = change;
    await this.gate.assertRoomFor(change, { workspaceId, id: { in: productIds } });
    await this.listings.addToStore(workspaceId, connectionId, productIds);
    await this.rules.changeExclusions(workspaceId, connectionId, { restore: productIds });
    await this.queue.enqueue(jobs(change, [SyncJobKind.Content, SyncJobKind.Inventory]));
  }

  /** Takes the products out of the store, so the automatic rule cannot bring them back. */
  async remove(change: StoreMembershipChange): Promise<void> {
    const { workspaceId, connectionId, productIds } = change;
    await this.listings.releaseFromStore(workspaceId, connectionId, productIds);
    await this.rules.changeExclusions(workspaceId, connectionId, { exclude: productIds });
    await this.queue.enqueue(jobs(change, [SyncJobKind.Delist]));
  }
}
