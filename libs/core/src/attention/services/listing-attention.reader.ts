import { Injectable } from '@nestjs/common';
import { ChannelListingsService } from '../../listings/services/channel-listings.service.js';
import type { AttentionList, AttentionListingGroup } from '../entities/attention-summary.js';
import { AttentionRepository } from '../repositories/attention.repository.js';
import { toListingGroup } from '../rules/attention.mappers.js';

/** Failed listings, counted as the Channels page counts them and grouped by product and store. */
@Injectable()
export class ListingAttentionReader {
  constructor(
    private readonly channelListings: ChannelListingsService,
    private readonly attention: AttentionRepository,
  ) {}

  async read(workspaceId: string, limit: number): Promise<AttentionList<AttentionListingGroup>> {
    const [failed, groups] = await Promise.all([
      this.channelListings.failedCounts(workspaceId),
      this.attention.listFailedGroups(workspaceId, limit),
    ]);
    const count = [...failed.values()].reduce((sum, listings) => sum + listings, 0);
    return { count, items: groups.map(toListingGroup) };
  }
}
