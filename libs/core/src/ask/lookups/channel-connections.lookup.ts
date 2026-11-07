import { Injectable } from '@nestjs/common';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { connectionFacts } from '../rules/account-facts.js';
import { ACCOUNT_PAGES, AccountFactPages } from './account-fact-pages.js';
import { AccountLookup } from './account-lookup.js';

/** The workspace's store connections and whether they work. */
@Injectable()
export class ChannelConnectionsLookup extends AccountLookup {
  readonly kind = AccountLookupKind.ChannelConnections;
  readonly permissions = [WorkspacePermission.ViewChannels];

  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly pages: AccountFactPages,
  ) {
    super();
  }

  async run(workspaceId: string): Promise<KnowledgeChunk[]> {
    const connections = await this.connections.list(workspaceId);
    return [
      this.pages.chunk({
        id: this.kind,
        title: 'Connected stores',
        path: ACCOUNT_PAGES.channels,
        text: connectionFacts(connections),
      }),
    ];
  }
}
