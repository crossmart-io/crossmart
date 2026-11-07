import { Injectable } from '@nestjs/common';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { ChannelListingsService } from '../../listings/services/channel-listings.service.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { ASK_LOOKUP_FAILED_LISTINGS_LIMIT } from '../ask.constants.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { failedListingFacts } from '../rules/account-facts.js';
import { ACCOUNT_PAGES, AccountFactPages } from './account-fact-pages.js';
import { AccountLookup } from './account-lookup.js';

/** The latest listings the workspace's stores refused, with why. */
@Injectable()
export class FailedListingsLookup extends AccountLookup {
  readonly kind = AccountLookupKind.FailedListings;
  readonly permissions = [WorkspacePermission.ViewChannels];

  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly listings: ChannelListingsService,
    private readonly pages: AccountFactPages,
  ) {
    super();
  }

  async run(workspaceId: string): Promise<KnowledgeChunk[]> {
    const connections = await this.connections.list(workspaceId);
    const failures = await this.listings.recentFailures(
      workspaceId,
      connections,
      ASK_LOOKUP_FAILED_LISTINGS_LIMIT,
    );
    return [
      this.pages.chunk({
        id: this.kind,
        title: 'Recent failed listings',
        path: ACCOUNT_PAGES.channels,
        text: failedListingFacts(failures, connections),
      }),
    ];
  }
}
