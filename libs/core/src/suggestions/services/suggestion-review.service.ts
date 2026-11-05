import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SuggestionStatus } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { BulkReviewResult, SuggestionRef, SuggestionView } from '../entities/suggestion.js';
import type { SuggestionRecord } from '../repositories/suggestion.queries.js';
import { SuggestionRepository } from '../repositories/suggestion.repository.js';
import { describeSuggestion } from '../rules/suggestion-change.js';
import { SUGGESTION_NOT_FOUND, SUGGESTION_NOT_PENDING } from '../suggestions.constants.js';
import { type ApprovalOutcome, SuggestionApplier } from './suggestion.applier.js';
import { SuggestionsService } from './suggestions.service.js';

/** A bulk review: the workspace, the suggestions and who reviews them. */
export interface BulkReview {
  workspaceId: string;
  suggestionIds: readonly string[];
  actor: Actor;
}

/**
 * Approves and rejects suggestions. Approving applies the change, or marks the suggestion
 * stale when what it would replace has changed since it was made. Only pending suggestions
 * can be reviewed, and each review is logged.
 */
@Injectable()
export class SuggestionReviewService {
  constructor(
    private readonly suggestions: SuggestionRepository,
    private readonly applier: SuggestionApplier,
    private readonly views: SuggestionsService,
    private readonly activity: ActivityRecorder,
  ) {}

  async approve(ref: SuggestionRef, actor: Actor): Promise<SuggestionView> {
    const record = await this.requirePending(ref);
    const outcome = await this.applier.approve(record, actor);
    if (outcome === SuggestionStatus.APPLIED) {
      await this.record(record, actor, ActivityAction.SuggestionApproved);
    }
    return this.views.get(ref);
  }

  async reject(ref: SuggestionRef, actor: Actor): Promise<SuggestionView> {
    const record = await this.requirePending(ref);
    const claimed = await this.suggestions.review({
      ref,
      status: SuggestionStatus.REJECTED,
      actor,
    });
    if (!claimed) throw new ConflictException(SUGGESTION_NOT_PENDING);
    await this.record(record, actor, ActivityAction.SuggestionRejected);
    return this.views.get(ref);
  }

  /** Approves each pending suggestion in turn; the others are reported as skipped. */
  async bulkApprove({ workspaceId, suggestionIds, actor }: BulkReview): Promise<BulkReviewResult> {
    const pending = await this.suggestions.findPending(workspaceId, suggestionIds);
    const reviewed: SuggestionRecord[] = [];
    const applied: SuggestionRecord[] = [];
    for (const record of pending) {
      const outcome = await this.tryApprove(record, actor);
      if (outcome) reviewed.push(record);
      if (outcome === SuggestionStatus.APPLIED) applied.push(record);
    }
    await this.recordBulk(workspaceId, actor, applied);
    const reviewedIds = new Set(reviewed.map((record) => record.id));
    const items = await Promise.all(
      reviewed.map((record) => this.views.get({ workspaceId, suggestionId: record.id })),
    );
    return { items, skippedIds: suggestionIds.filter((id) => !reviewedIds.has(id)) };
  }

  /** Null when another review got there first; other errors stop the bulk review. */
  private async tryApprove(
    record: SuggestionRecord,
    actor: Actor,
  ): Promise<ApprovalOutcome | null> {
    try {
      return await this.applier.approve(record, actor);
    } catch (error) {
      if (error instanceof ConflictException) return null;
      throw error;
    }
  }

  private async requirePending(ref: SuggestionRef): Promise<SuggestionRecord> {
    const record = await this.suggestions.find(ref);
    if (!record) throw new NotFoundException(SUGGESTION_NOT_FOUND);
    if (record.status !== SuggestionStatus.PENDING) {
      throw new ConflictException(SUGGESTION_NOT_PENDING);
    }
    return record;
  }

  private record(record: SuggestionRecord, actor: Actor, action: ActivityAction): Promise<void> {
    return this.activity.record(record.workspaceId, actor, {
      action,
      subject: {
        type: ActivitySubjectType.Product,
        id: record.productId,
        label: record.product.title,
      },
      detail: describeSuggestion(record),
    });
  }

  private async recordBulk(
    workspaceId: string,
    actor: Actor,
    applied: SuggestionRecord[],
  ): Promise<void> {
    if (applied.length === 0) return;
    await this.activity.record(workspaceId, actor, {
      action: ActivityAction.SuggestionsBulkApproved,
      itemCount: applied.length,
      relatedSubjectIds: [...new Set(applied.map((record) => record.productId))],
    });
  }
}
