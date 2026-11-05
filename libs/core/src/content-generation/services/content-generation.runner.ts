import { Injectable } from '@nestjs/common';
import { SuggestionCreatorType } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import type { ActivityEntry } from '../../activity/entities/activity-entry.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import {
  AiKeyRejectedError,
  AiNotConfiguredError,
  AiOutputRejectedError,
} from '../../ai/errors/ai.errors.js';
import type { NewSuggestion } from '../../suggestions/entities/suggestion.js';
import { SuggestionAgent } from '../../suggestions/enums/suggestion-agent.enum.js';
import { SuggestionKind } from '../../suggestions/enums/suggestion-kind.enum.js';
import { SuggestionWriter } from '../../suggestions/services/suggestion.writer.js';
import type { ContentGenerationJob } from '../entities/content-generation.js';
import type { GeneratedContent } from '../rules/generated-content.schema.js';
import { ContentGenerator } from './content.generator.js';
import { type ContentTarget, ContentTargetLoader } from './content-target.loader.js';

/** Whether the job will be retried after this attempt, so failures are logged once. */
export interface ContentRunOptions {
  finalAttempt: boolean;
}

/**
 * Runs one content generation job in the worker: generates, then stores the changes as
 * pending suggestions for review. Unusable answers and a missing key are final; outages are
 * retried, and logged once the last attempt fails.
 */
@Injectable()
export class ContentGenerationRunner {
  constructor(
    private readonly targets: ContentTargetLoader,
    private readonly generator: ContentGenerator,
    private readonly suggestions: SuggestionWriter,
    private readonly activity: ActivityRecorder,
  ) {}

  async run(job: ContentGenerationJob, options: ContentRunOptions): Promise<void> {
    const target = await this.targets.load(job);
    if (!target) return;
    try {
      const generated = await this.generator.generate(target);
      await this.suggestions.propose(this.toSuggestions(job, target, generated));
      await this.activity.record(job.workspaceId, Actor.system(), this.entryFor(target));
    } catch (error) {
      const permanent =
        error instanceof AiOutputRejectedError ||
        error instanceof AiNotConfiguredError ||
        error instanceof AiKeyRejectedError;
      if (permanent || options.finalAttempt) {
        await this.activity.recordFailure(
          job.workspaceId,
          Actor.system(),
          this.entryFor(target),
          error,
        );
      }
      if (!permanent) throw error;
    }
  }

  private toSuggestions(
    job: ContentGenerationJob,
    target: ContentTarget,
    generated: GeneratedContent,
  ): NewSuggestion[] {
    const base = {
      workspaceId: job.workspaceId,
      productId: job.productId,
      connectionId: job.connectionId,
      createdByType: SuggestionCreatorType.AGENT,
      agent: SuggestionAgent.ContentGenerator,
      requestedByUserId: job.requestedBy.userId,
      requestedByApiKeyId: job.requestedBy.apiKeyId,
    };
    return [
      {
        ...base,
        kind: SuggestionKind.ListingTitle,
        currentValue: target.current.title,
        proposedValue: generated.title,
        rationale: generated.titleRationale,
      },
      {
        ...base,
        kind: SuggestionKind.ListingDescription,
        currentValue: target.current.descriptionHtml,
        proposedValue: generated.descriptionHtml,
        rationale: generated.descriptionRationale,
      },
    ];
  }

  private entryFor(target: ContentTarget): ActivityEntry {
    return {
      action: ActivityAction.ContentGenerated,
      subject: {
        type: ActivitySubjectType.Product,
        id: target.product.id,
        label: target.product.title,
      },
      detail: target.store.displayName,
    };
  }
}
