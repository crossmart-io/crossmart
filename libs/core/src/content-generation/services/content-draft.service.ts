import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AI_MAX_OUTPUT_TOKENS } from '../../ai/ai.constants.js';
import { AiFeature } from '../../ai/enums/ai-feature.enum.js';
import { AiOutputRejectedError } from '../../ai/errors/ai.errors.js';
import {
  contentRefinerSystemPrompt,
  contentRefinerUserPrompt,
} from '../../ai/prompts/content-refiner.v1.prompt.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import { ProductsService } from '../../catalog/services/products.service.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ListingContent } from '../../listings/entities/listing-override.js';
import { ListingContentReader } from '../../listings/services/listing-content.reader.js';
import {
  CONTENT_GENERATION_PRODUCTS_NOT_FOUND,
  CONTENT_GENERATION_UNSUPPORTED_CHANNEL,
  EMPTY_AFTER_CLEANING,
} from '../content-generation.constants.js';
import type { ContentDraft, ContentDraftRequest } from '../entities/content-draft.js';
import {
  CATALOG_CONTENT_RULES,
  type ChannelContentRules,
  contentRulesFor,
} from '../rules/channel-content-rules.js';
import { cleanDescription, cleanTitle } from '../rules/content-cleaning.js';
import { type ContentDraftOutput, contentDraftSchema } from '../rules/generated-content.schema.js';
import { promptProduct } from '../rules/prompt-product.js';

/** Where the text will appear: its rules, the product, and the text saved there now. */
interface DraftTarget {
  rules: ChannelContentRules;
  product: ProductDetail;
  saved: ListingContent;
}

/**
 * Rewrites the fields a merchant is editing, right away, for them to keep or change before
 * saving. Unlike the Content Generator's suggestions, nothing is queued or stored; only the
 * call is metered.
 */
@Injectable()
export class ContentDraftService {
  constructor(
    private readonly ai: AiGateway,
    private readonly products: ProductsService,
    private readonly connections: ChannelConnectionsService,
    private readonly listings: ListingContentReader,
  ) {}

  async draft(request: ContentDraftRequest): Promise<ContentDraft> {
    this.ai.assertConfigured();
    const target = await this.target(request);
    const fields = new Set(request.fields);
    const { output } = await this.ai.generate(
      { workspaceId: request.workspaceId, feature: AiFeature.ContentDraft },
      {
        system: contentRefinerSystemPrompt(target.rules),
        prompt: contentRefinerUserPrompt({
          fields: [...fields],
          instruction: request.instruction,
          product: promptProduct(target.product),
          current: { ...target.saved, ...request.current },
        }),
        schema: contentDraftSchema(target.rules, fields),
        maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
      },
    );
    return this.clean(output, target.rules);
  }

  private target(request: ContentDraftRequest): Promise<DraftTarget> {
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
    const rules = contentRulesFor(store.channel);
    if (!rules) throw new UnprocessableEntityException(CONTENT_GENERATION_UNSUPPORTED_CHANNEL);
    const listing = await this.listings.read({
      workspaceId: request.workspaceId,
      connectionId,
      productId: request.productId,
    });
    if (!listing) throw new NotFoundException(CONTENT_GENERATION_PRODUCTS_NOT_FOUND);
    return { rules, product: listing.product, saved: listing.content };
  }

  /** Titles lose any markup and descriptions keep only what the channel takes. */
  private clean(output: ContentDraftOutput, rules: ChannelContentRules): ContentDraft {
    const title = output.title === undefined ? null : cleanTitle(output.title);
    const descriptionHtml =
      output.descriptionHtml === undefined ? null : cleanDescription(output.descriptionHtml, rules);
    if (title === '' || descriptionHtml === '') {
      throw new AiOutputRejectedError(EMPTY_AFTER_CLEANING);
    }
    return { title, descriptionHtml };
  }
}
