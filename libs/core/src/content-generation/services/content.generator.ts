import { Injectable } from '@nestjs/common';
import { sanitizeDescriptionHtml, toPlainText } from '@crossmart/common';
import { AI_MAX_OUTPUT_TOKENS } from '../../ai/ai.constants.js';
import { AiFeature } from '../../ai/enums/ai-feature.enum.js';
import { AiOutputRejectedError } from '../../ai/errors/ai.errors.js';
import {
  type ContentGeneratorProduct,
  contentGeneratorSystemPrompt,
  contentGeneratorUserPrompt,
} from '../../ai/prompts/content-generator.v1.prompt.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import {
  PROMPT_DESCRIPTION_MAX_LENGTH,
  PROMPT_OPTION_VALUES_MAX,
} from '../content-generation.constants.js';
import {
  type GeneratedContent,
  generatedContentSchema,
} from '../rules/generated-content.schema.js';
import type { ContentTarget } from './content-target.loader.js';

const EMPTY_AFTER_CLEANING = 'the answer was empty once its markup was cleaned';

/**
 * The Content Generator agent: writes a channel-optimised title and description for one
 * product, within the channel's rules. Answers are validated against the channel's schema and
 * cleaned of markup the channel does not take; an unusable answer is rejected.
 */
@Injectable()
export class ContentGenerator {
  constructor(private readonly ai: AiGateway) {}

  async generate(target: ContentTarget): Promise<GeneratedContent> {
    const { output } = await this.ai.generate(
      { workspaceId: target.workspaceId, feature: AiFeature.ContentGeneration },
      {
        system: contentGeneratorSystemPrompt(target.rules),
        prompt: contentGeneratorUserPrompt({
          rules: target.rules,
          product: this.describe(target.product),
          current: target.current,
        }),
        schema: generatedContentSchema(target.rules),
        maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
      },
    );
    return this.clean(output, target);
  }

  private describe(product: ProductDetail): ContentGeneratorProduct {
    const optionValues = new Set(product.variants.flatMap((variant) => variant.optionValues));
    return {
      title: product.title,
      descriptionHtml: product.descriptionHtml.slice(0, PROMPT_DESCRIPTION_MAX_LENGTH),
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      optionNames: product.optionNames,
      optionValues: [...optionValues].slice(0, PROMPT_OPTION_VALUES_MAX),
    };
  }

  /** Titles lose any markup; descriptions keep only what the channel takes. */
  private clean(output: GeneratedContent, target: ContentTarget): GeneratedContent {
    const title = toPlainText(output.title);
    const descriptionHtml = sanitizeDescriptionHtml(output.descriptionHtml, {
      allowLinks: target.rules.allowsLinks,
    });
    if (!title || !descriptionHtml) {
      throw new AiOutputRejectedError(EMPTY_AFTER_CLEANING);
    }
    return {
      title,
      descriptionHtml,
      titleRationale: output.titleRationale.trim(),
      descriptionRationale: output.descriptionRationale.trim(),
    };
  }
}
