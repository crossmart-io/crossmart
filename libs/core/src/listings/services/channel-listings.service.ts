import { Injectable } from '@nestjs/common';
import { toCursorPage } from '@crossmart/common';
import type { ChannelListingPage, ChannelListingQuery } from '../entities/listing-views.js';
import { toChannelListingRow } from '../mappers/listing.mapper.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';

/** A connection's listings, newest change first. */
@Injectable()
export class ChannelListingsService {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly listings: ListingSyncRepository,
  ) {}

  async list(
    workspaceId: string,
    connectionId: string,
    query: ChannelListingQuery,
  ): Promise<ChannelListingPage> {
    await this.connections.require(workspaceId, connectionId);
    const { rows, nextCursor } = toCursorPage(
      await this.listings.listPage(workspaceId, connectionId, query),
      query.limit,
    );
    return { items: rows.map((row) => toChannelListingRow(row)), nextCursor };
  }
}
