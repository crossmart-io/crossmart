import { BadRequestException, Injectable } from '@nestjs/common';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import {
  CONTENT_GENERATION_PRODUCTS_NOT_FOUND,
  CONTENT_GENERATION_UNSUPPORTED_CHANNEL,
} from '../content-generation.constants.js';
import type { ContentGenerationRequest } from '../entities/content-generation.js';
import {
  ContentProductRepository,
  type ProductTitle,
} from '../repositories/content-product.repository.js';
import { contentRulesFor } from '../rules/channel-content-rules.js';

/** A request whose store and products all exist in the workspace. */
export interface ValidatedContentRequest {
  store: ChannelConnectionView;
  products: ProductTitle[];
}

/** Checks a content request names a store with content rules and the workspace's own products. */
@Injectable()
export class ContentRequestValidator {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly products: ContentProductRepository,
  ) {}

  async validate(request: ContentGenerationRequest): Promise<ValidatedContentRequest> {
    const store = await this.connections.get(request.workspaceId, request.connectionId);
    if (!contentRulesFor(store.channel)) {
      throw new BadRequestException(CONTENT_GENERATION_UNSUPPORTED_CHANNEL);
    }
    const productIds = [...new Set(request.productIds)];
    const products = await this.products.findTitles(request.workspaceId, productIds);
    if (products.length !== productIds.length) {
      throw new BadRequestException(CONTENT_GENERATION_PRODUCTS_NOT_FOUND);
    }
    return { store, products };
  }
}
