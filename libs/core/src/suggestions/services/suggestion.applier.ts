import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { findEnumValue } from '@crossmart/common';
import { SuggestionStatus } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import type { OverrideTarget } from '../../listings/services/listing-override.writer.js';
import { ListingContentReader } from '../../listings/services/listing-content.reader.js';
import { ListingOverridesService } from '../../listings/services/listing-overrides.service.js';
import type { SuggestionRef } from '../entities/suggestion.js';
import { SuggestionKind } from '../enums/suggestion-kind.enum.js';
import type { SuggestionRecord } from '../repositories/suggestion.queries.js';
import { SuggestionRepository } from '../repositories/suggestion.repository.js';
import { currentValueOf, SUGGESTION_KIND_FIELDS } from '../rules/suggestion-change.js';
import {
  SUGGESTION_KIND_UNKNOWN,
  SUGGESTION_NEEDS_CHANNEL,
  SUGGESTION_NOT_FOUND,
  SUGGESTION_NOT_PENDING,
} from '../suggestions.constants.js';

/** Where a content suggestion applies and what it changes. */
interface ContentChange {
  target: OverrideTarget;
  kind: SuggestionKind;
}

/** The outcome of approving: the change was applied, or the value it replaces had changed. */
export type ApprovalOutcome = typeof SuggestionStatus.APPLIED | typeof SuggestionStatus.STALE;

/**
 * Applies approved suggestions through the same service a user's edit goes through, so the
 * change is validated, synced to the channel and logged like any other. A suggestion whose
 * current value no longer matches what the listing shows is marked stale instead.
 */
@Injectable()
export class SuggestionApplier {
  constructor(
    private readonly content: ListingContentReader,
    private readonly overrides: ListingOverridesService,
    private readonly suggestions: SuggestionRepository,
  ) {}

  async approve(record: SuggestionRecord, actor: Actor): Promise<ApprovalOutcome> {
    const change = this.toChange(record);
    if (!(await this.isCurrent(change, record.currentValue))) {
      await this.claim(record, SuggestionStatus.STALE, actor);
      return SuggestionStatus.STALE;
    }
    await this.claim(record, SuggestionStatus.APPLIED, actor);
    try {
      await this.overrides.saveContent(
        change.target,
        { [SUGGESTION_KIND_FIELDS[change.kind]]: record.proposedValue },
        actor,
      );
    } catch (error) {
      await this.suggestions.reopen(this.refOf(record));
      throw error;
    }
    return SuggestionStatus.APPLIED;
  }

  private toChange(record: SuggestionRecord): ContentChange {
    const kind = findEnumValue(SuggestionKind, record.kind);
    if (!kind) throw new BadRequestException(SUGGESTION_KIND_UNKNOWN);
    if (!record.connectionId) throw new BadRequestException(SUGGESTION_NEEDS_CHANNEL);
    const { workspaceId, connectionId, productId } = record;
    return { kind, target: { workspaceId, connectionId, productId } };
  }

  private async isCurrent(change: ContentChange, expected: string): Promise<boolean> {
    const listing = await this.content.read(change.target);
    if (!listing) throw new NotFoundException(SUGGESTION_NOT_FOUND);
    return currentValueOf(change.kind, listing.content) === expected;
  }

  /** Marks the review first, so two approvals at once never apply the change twice. */
  private async claim(
    record: SuggestionRecord,
    status: ApprovalOutcome,
    actor: Actor,
  ): Promise<void> {
    const claimed = await this.suggestions.review({ ref: this.refOf(record), status, actor });
    if (!claimed) throw new ConflictException(SUGGESTION_NOT_PENDING);
  }

  private refOf(record: SuggestionRecord): SuggestionRef {
    return { workspaceId: record.workspaceId, suggestionId: record.id };
  }
}
