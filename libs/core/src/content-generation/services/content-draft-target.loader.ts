import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import { ProductsService } from '../../catalog/services/products.service.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ListingContent } from '../../listings/entities/listing-override.js';
import { ListingContentReader } from '../../listings/services/listing-content.reader.js';
import {
  CONTENT_GENERATION_PRODUCTS_NOT_FOUND,
  CONTENT_GENERATION_UNSUPPORTED_CHANNEL,
} from '../content-generation.constants.js';
import type { ContentDraftRequest } from '../entities/content-draft.js';
import { CATALOG_CONTENT_RULES, type ChannelContentRules } from '../rules/channel-content-rules.js';
import { ChannelContentRulesResolver } from './channel-content-rules.resolver.js';

/** Where the text will appear: its rules, the product, and the text saved there now. */
export interface DraftTarget {
  rules: ChannelContentRules;
  product: ProductDetail;
  saved: ListingContent;
}

/** Loads what a draft is written for: the catalog, or one store's listing of the product. */
@Injectable()
export class ContentDraftTargetLoader {
  constructor(
    private readonly products: ProductsService,
    private readonly connections: ChannelConnectionsService,
    private readonly listings: ListingContentReader,
    private readonly rules: ChannelContentRulesResolver,
  ) {}

  load(request: ContentDraftRequest): Promise<DraftTarget> {
    return request.connectionId
      ? this.storeTarget(request, request.connectionId)
      : this.catalogTarget(request);
  }

  private async catalogTarget(request: ContentDraftRequest): Promise<DraftTarget> {
    const product = await this.products.get(request.workspaceId, request.productId);
    return {
      rules: CATALOG_CONTENT_RULES,
      product,
      saved: { title: product.title, descriptionHtml: product.descriptionHtml },
    };
  }

  private async storeTarget(
    request: ContentDraftRequest,
    connectionId: string,
  ): Promise<DraftTarget> {
    const store = await this.connections.get(request.workspaceId, connectionId);
    const rules = this.rules.rulesFor(store.channel);
    if (!rules) throw new UnprocessableEntityException(CONTENT_GENERATION_UNSUPPORTED_CHANNEL);
    const listing = await this.listings.read({
      workspaceId: request.workspaceId,
      connectionId,
      productId: request.productId,
    });
    if (!listing) throw new NotFoundException(CONTENT_GENERATION_PRODUCTS_NOT_FOUND);
    return { rules, product: listing.product, saved: listing.content };
  }
}
