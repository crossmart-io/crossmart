import { Injectable } from '@nestjs/common';
import {
  type CountedRecords,
  SortDirection,
  sortWithTiebreak,
  toPageWindow,
} from '@crossmart/common';
import { type Prisma, PrismaService, SuggestionStatus } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import type { NewSuggestion, SuggestionQuery, SuggestionRef } from '../entities/suggestion.js';
import { SUGGESTION_INCLUDE, type SuggestionRecord } from './suggestion.queries.js';

/** A review to record on a pending suggestion. */
export interface SuggestionReview {
  ref: SuggestionRef;
  status: SuggestionStatus;
  actor: Actor;
}

/** Suggestions, always read and changed inside one workspace. */
@Injectable()
export class SuggestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stores new suggestions. A pending suggestion for the same product, channel and kind is
   * replaced: it is marked stale, so the inbox holds one proposal per field.
   */
  async replacePending(suggestions: readonly NewSuggestion[]): Promise<void> {
    if (suggestions.length === 0) return;
    await this.prisma.$transaction([
      ...suggestions.map((suggestion) =>
        this.prisma.suggestion.updateMany({
          where: {
            workspaceId: suggestion.workspaceId,
            productId: suggestion.productId,
            connectionId: suggestion.connectionId,
            kind: suggestion.kind,
            status: SuggestionStatus.PENDING,
          },
          data: { status: SuggestionStatus.STALE },
        }),
      ),
      this.prisma.suggestion.createMany({ data: [...suggestions] }),
    ]);
  }

  find(ref: SuggestionRef): Promise<SuggestionRecord | null> {
    return this.prisma.suggestion.findFirst({
      where: { id: ref.suggestionId, workspaceId: ref.workspaceId },
      include: SUGGESTION_INCLUDE,
    });
  }

  /** The workspace's pending suggestions among these ids, oldest first. */
  findPending(workspaceId: string, suggestionIds: readonly string[]): Promise<SuggestionRecord[]> {
    return this.prisma.suggestion.findMany({
      where: { workspaceId, id: { in: [...suggestionIds] }, status: SuggestionStatus.PENDING },
      include: SUGGESTION_INCLUDE,
      orderBy: sortWithTiebreak('createdAt', SortDirection.Asc),
    });
  }

  async listPage(
    workspaceId: string,
    query: SuggestionQuery,
  ): Promise<CountedRecords<SuggestionRecord>> {
    const where = this.toFilter(workspaceId, query);
    const [records, total] = await this.prisma.$transaction([
      this.prisma.suggestion.findMany({
        where,
        include: SUGGESTION_INCLUDE,
        orderBy: sortWithTiebreak('createdAt', SortDirection.Desc),
        ...toPageWindow(query),
      }),
      this.prisma.suggestion.count({ where }),
    ]);
    return { records, total };
  }

  /**
   * Records a review, but only on a suggestion still pending: false when another review got
   * there first, so a suggestion is never applied twice.
   */
  async review({ ref, status, actor }: SuggestionReview): Promise<boolean> {
    const { count } = await this.prisma.suggestion.updateMany({
      where: {
        id: ref.suggestionId,
        workspaceId: ref.workspaceId,
        status: SuggestionStatus.PENDING,
      },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedByUserId: actor.userId,
        reviewedByApiKeyId: actor.apiKeyId,
      },
    });
    return count > 0;
  }

  /** Puts a suggestion back to pending, when applying it failed after it was claimed. */
  async reopen(ref: SuggestionRef): Promise<void> {
    await this.prisma.suggestion.updateMany({
      where: { id: ref.suggestionId, workspaceId: ref.workspaceId },
      data: {
        status: SuggestionStatus.PENDING,
        reviewedAt: null,
        reviewedByUserId: null,
        reviewedByApiKeyId: null,
      },
    });
  }

  private toFilter(workspaceId: string, query: SuggestionQuery): Prisma.SuggestionWhereInput {
    return {
      workspaceId,
      status: query.status,
      productId: query.productId,
      connectionId: query.connectionId,
      kind: query.kind,
    };
  }
}
