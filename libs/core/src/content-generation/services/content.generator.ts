import { Injectable } from '@nestjs/common';
import { AI_MAX_OUTPUT_TOKENS } from '../../ai/ai.constants.js';
import { AiFeature } from '../../ai/enums/ai-feature.enum.js';
import { AiOutputRejectedError } from '../../ai/errors/ai.errors.js';
import {
  contentGeneratorSystemPrompt,
  contentGeneratorUserPrompt,
} from '../../ai/prompts/content-generator.v1.prompt.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import { EMPTY_AFTER_CLEANING } from '../content-generation.constants.js';
import { cleanDescription, cleanTitle } from '../rules/content-cleaning.js';
import {
  type GeneratedContent,
  generatedContentSchema,
} from '../rules/generated-content.schema.js';
import { promptProduct } from '../rules/prompt-product.js';
import type { ContentTarget } from './content-target.loader.js';

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
          product: promptProduct(target.product),
          current: target.current,
        }),
        schema: generatedContentSchema(target.rules),
        maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
      },
    );
    return this.clean(output, target);
  }

  /** Titles lose any markup; descriptions keep only what the channel takes. */
  private clean(output: GeneratedContent, target: ContentTarget): GeneratedContent {
    const title = cleanTitle(output.title);
    const descriptionHtml = cleanDescription(output.descriptionHtml, target.rules);
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
