import { Injectable } from '@nestjs/common';
import { AI_MAX_OUTPUT_TOKENS } from '../../ai/ai.constants.js';
import { AiFeature } from '../../ai/enums/ai-feature.enum.js';
import { AiOutputRejectedError } from '../../ai/errors/ai.errors.js';
import {
  contentRefinerSystemPrompt,
  contentRefinerUserPrompt,
} from '../../ai/prompts/content-refiner.v1.prompt.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import { EMPTY_AFTER_CLEANING } from '../content-generation.constants.js';
import type { ContentDraft, ContentDraftRequest } from '../entities/content-draft.js';
import type { ChannelContentRules } from '../rules/channel-content-rules.js';
import { cleanDescription, cleanTitle } from '../rules/content-cleaning.js';
import { type ContentDraftOutput, contentDraftSchema } from '../rules/generated-content.schema.js';
import { promptProduct } from '../rules/prompt-product.js';
import { ContentDraftTargetLoader } from './content-draft-target.loader.js';

/**
 * Rewrites the fields a merchant is editing, right away, for them to keep or change before
 * saving. Unlike the Content Generator's suggestions, nothing is queued or stored; only the
 * call is metered.
 */
@Injectable()
export class ContentDraftService {
  constructor(
    private readonly ai: AiGateway,
    private readonly targets: ContentDraftTargetLoader,
  ) {}

  async draft(request: ContentDraftRequest): Promise<ContentDraft> {
    this.ai.assertConfigured();
    const target = await this.targets.load(request);
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
