import { Injectable } from '@nestjs/common';
import { ImportJobStatus, type Prisma, PrismaService } from '@crossmart/database';
import type { NewImportJob } from '../../../catalog/entities/import-job.js';
import type { OutcomeIssue } from '../../../catalog/repositories/import-job.repository.js';
import {
  CHANNEL_IMPORT_LOCK_PREFIX,
  IMPORT_SWEEP_BATCH_SIZE,
} from '../channel-import.constants.js';
import type { PageOutcome } from '../entities/channel-import.js';

/** What a run needs to know about its import job. */
export const CHANNEL_IMPORT_RUN_SELECT = {
  id: true,
  workspaceId: true,
  connectionId: true,
  fileName: true,
  status: true,
  cursor: true,
  userId: true,
  apiKeyId: true,
  createdAt: true,
  createdCount: true,
  linkedCount: true,
  updatedCount: true,
  skippedCount: true,
  failedCount: true,
} satisfies Prisma.ImportJobSelect;

export type ChannelImportRunRecord = Prisma.ImportJobGetPayload<{
  select: typeof CHANNEL_IMPORT_RUN_SELECT;
}>;

export interface StartedImportJob {
  jobId: string;
  /** False when an import of the connection was already running and is returned instead. */
  created: boolean;
}

/** One written page: where to resume, and what it did. */
export interface ImportPageProgress {
  nextCursor: string | null;
  totalCount: number | null;
  outcome: PageOutcome;
}

/**
 * Import jobs that read a channel's catalog. Progress is written page by page with the
 * resume cursor, so a stopped run continues where it was. Every statement is scoped to the
 * workspace.
 */
@Injectable()
export class ChannelImportJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Starts an import of the connection unless one is already running, under a lock on the
   * connection, so concurrent requests never start two.
   */
  startOrFindRunning(
    workspaceId: string,
    job: NewImportJob & { connectionId: string },
  ): Promise<StartedImportJob> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${CHANNEL_IMPORT_LOCK_PREFIX + job.connectionId}))`;
      const running = await tx.importJob.findFirst({
        where: { workspaceId, connectionId: job.connectionId, status: ImportJobStatus.PROCESSING },
        select: { id: true },
      });
      if (running) {
        return { jobId: running.id, created: false };
      }
      const { id } = await tx.importJob.create({
        data: {
          workspaceId,
          connectionId: job.connectionId,
          userId: job.actor.userId,
          apiKeyId: job.actor.apiKeyId,
          mode: job.mode,
          format: job.format,
          fileName: job.fileName,
        },
        select: { id: true },
      });
      return { jobId: id, created: true };
    });
  }

  findForRun(workspaceId: string, jobId: string): Promise<ChannelImportRunRecord | null> {
    return this.prisma.importJob.findFirst({
      where: { id: jobId, workspaceId },
      select: CHANNEL_IMPORT_RUN_SELECT,
    });
  }

  /**
   * Adds a page's counts and issues and moves the cursor, in one transaction. The last page
   * (no next cursor) completes the job in the same statement, so a finished import is never
   * read again from the start.
   */
  async recordPage(
    workspaceId: string,
    jobId: string,
    progress: ImportPageProgress,
  ): Promise<void> {
    const { outcome, nextCursor, totalCount } = progress;
    await this.prisma.$transaction(async (tx) => {
      const position = await tx.importJobIssue.count({ where: { jobId, workspaceId } });
      await tx.importJobIssue.createMany({
        data: toIssueRows(workspaceId, jobId, position, outcome.issues),
      });
      await tx.importJob.updateMany({
        where: { id: jobId, workspaceId, status: ImportJobStatus.PROCESSING },
        data: {
          cursor: nextCursor,
          ...(totalCount === null ? {} : { totalCount }),
          createdCount: { increment: outcome.created },
          linkedCount: { increment: outcome.linked },
          updatedCount: { increment: outcome.updated },
          skippedCount: { increment: outcome.skipped },
          failedCount: { increment: outcome.failed },
          ...(nextCursor === null
            ? { status: ImportJobStatus.COMPLETED, finishedAt: new Date() }
            : {}),
        },
      });
    });
  }

  /**
   * Channel imports still running that wrote nothing since `before`, across workspaces: the
   * worker that ran them is gone. Oldest first, a batch at a time.
   */
  findStalled(before: Date): Promise<ChannelImportRunRecord[]> {
    return this.prisma.importJob.findMany({
      where: {
        status: ImportJobStatus.PROCESSING,
        connectionId: { not: null },
        updatedAt: { lt: before },
      },
      select: CHANNEL_IMPORT_RUN_SELECT,
      orderBy: { updatedAt: 'asc' },
      take: IMPORT_SWEEP_BATCH_SIZE,
    });
  }

  async fail(workspaceId: string, jobId: string, errorMessage: string): Promise<void> {
    await this.prisma.importJob.updateMany({
      where: { id: jobId, workspaceId, status: ImportJobStatus.PROCESSING },
      data: { status: ImportJobStatus.FAILED, errorMessage, finishedAt: new Date() },
    });
  }
}

function toIssueRows(
  workspaceId: string,
  jobId: string,
  firstPosition: number,
  issues: OutcomeIssue[],
): Prisma.ImportJobIssueCreateManyInput[] {
  return issues.map(({ outcome, issue }, index) => ({
    workspaceId,
    jobId,
    position: firstPosition + index,
    outcome,
    code: issue.code,
    message: issue.message,
    handle: issue.handle ?? null,
    sku: issue.sku ?? null,
    row: null,
  }));
}
