import { type CountedRecords, toPageWindow } from '@crossmart/common';
import { Injectable } from '@nestjs/common';
import {
  type ImportIssueOutcome,
  ImportJobStatus,
  type Prisma,
  PrismaService,
} from '@crossmart/database';
import type { ImportIssue } from '../entities/catalog-import.js';
import type { ImportJobCounts, ImportJobListQuery, NewImportJob } from '../entities/import-job.js';
import {
  IMPORT_JOB_DETAIL_INCLUDE,
  IMPORT_JOB_SUMMARY_INCLUDE,
  type ImportJobDetailRecord,
  type ImportJobSummaryRecord,
} from './import-job.queries.js';

/** A skipped or failed record, tagged with which of the two it is. */
export interface OutcomeIssue {
  outcome: ImportIssueOutcome;
  issue: ImportIssue;
}

/** The import history. Every statement is scoped to the workspace. */
@Injectable()
export class ImportJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, job: NewImportJob): Promise<string> {
    const { id } = await this.prisma.importJob.create({
      data: {
        workspaceId,
        userId: job.actor.userId,
        apiKeyId: job.actor.apiKeyId,
        mode: job.mode,
        format: job.format,
        fileName: job.fileName,
        connectionId: job.connectionId ?? null,
      },
      select: { id: true },
    });
    return id;
  }

  /** Stores the counts and issues and marks the job completed, in one transaction. */
  async complete(
    workspaceId: string,
    jobId: string,
    counts: ImportJobCounts,
    issues: OutcomeIssue[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.importJobIssue.createMany({
        data: issues.map(({ outcome, issue }, position) => ({
          workspaceId,
          jobId,
          position,
          outcome,
          code: issue.code,
          message: issue.message,
          handle: issue.handle ?? null,
          sku: issue.sku ?? null,
          row: issue.row ?? null,
        })),
      }),
      this.prisma.importJob.updateMany({
        where: { id: jobId, workspaceId },
        data: {
          status: ImportJobStatus.COMPLETED,
          createdCount: counts.created,
          updatedCount: counts.updated,
          skippedCount: counts.skipped,
          failedCount: counts.failed,
          finishedAt: new Date(),
        },
      }),
    ]);
  }

  async fail(workspaceId: string, jobId: string, errorMessage: string): Promise<void> {
    await this.prisma.importJob.updateMany({
      where: { id: jobId, workspaceId },
      data: { status: ImportJobStatus.FAILED, errorMessage, finishedAt: new Date() },
    });
  }

  /** One page, newest first, plus one extra row that tells the caller whether more exist. */
  async listPage(
    workspaceId: string,
    query: ImportJobListQuery,
  ): Promise<CountedRecords<ImportJobSummaryRecord>> {
    const where: Prisma.ImportJobWhereInput = { workspaceId };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.importJob.findMany({
        where,
        include: IMPORT_JOB_SUMMARY_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toPageWindow(query),
      }),
      this.prisma.importJob.count({ where }),
    ]);
    return { records, total };
  }

  findDetail(workspaceId: string, jobId: string): Promise<ImportJobDetailRecord | null> {
    return this.prisma.importJob.findFirst({
      where: { id: jobId, workspaceId },
      include: IMPORT_JOB_DETAIL_INCLUDE,
    });
  }
}
