import { Injectable } from '@nestjs/common';
import type { SyncProgress } from '../entities/listing-sync-job.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';

/**
 * How far a store's sync has come, read from its listings: those a sync or retry marked queued
 * and whose job has not settled yet, and those in error. Two counts on an indexed column, so a
 * client can poll it.
 */
@Injectable()
export class SyncProgressService {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly listings: ListingSyncRepository,
  ) {}

  async progress(workspaceId: string, connectionId: string): Promise<SyncProgress> {
    await this.connections.require(workspaceId, connectionId);
    const scope = { workspaceId, connectionId };
    const [pending, failed] = await Promise.all([
      this.listings.countSyncPending(scope),
      this.listings.countFailed(scope),
    ]);
    return { pending, failed, done: pending === 0 };
  }
}
