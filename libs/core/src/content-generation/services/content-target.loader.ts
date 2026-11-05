import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ListingContent } from '../../listings/entities/listing-override.js';
import { ListingContentReader } from '../../listings/services/listing-content.reader.js';
import type { ContentGenerationJob } from '../entities/content-generation.js';
import type { ChannelContentRules } from '../rules/channel-content-rules.js';
import { ChannelContentRulesResolver } from './channel-content-rules.resolver.js';

/** Everything the agent needs to write for one product on one store. */
export interface ContentTarget {
  workspaceId: string;
  store: Pick<ChannelConnectionView, 'id' | 'displayName'>;
  rules: ChannelContentRules;
  product: ProductDetail;
  /** What the listing shows now, which the suggestions would replace. */
  current: ListingContent;
}

/** Loads a job's store, product and listing content; null once any of them is gone. */
@Injectable()
export class ContentTargetLoader {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly content: ListingContentReader,
    private readonly rules: ChannelContentRulesResolver,
  ) {}

  async load(job: ContentGenerationJob): Promise<ContentTarget | null> {
    const store = await this.findStore(job);
    const rules = store ? this.rules.rulesFor(store.channel) : null;
    if (!store || !rules) return null;
    const listing = await this.content.read(job);
    if (!listing) return null;
    return {
      workspaceId: job.workspaceId,
      store: { id: store.id, displayName: store.displayName },
      rules,
      product: listing.product,
      current: listing.content,
    };
  }

  private async findStore(job: ContentGenerationJob): Promise<ChannelConnectionView | null> {
    try {
      return await this.connections.get(job.workspaceId, job.connectionId);
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }
}
