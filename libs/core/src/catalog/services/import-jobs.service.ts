import { Injectable, NotFoundException } from '@nestjs/common';
import { toCursorPage } from '@crossmart/common';
import { ImportIssueOutcome } from '@crossmart/database';
import { toFailureReason } from '../../activity/rules/failure-reason.js';
import type { ImportOutcome } from '../entities/catalog-import.js';
import type {
  ImportJobCounts,
  ImportJobDetail,
  ImportJobListQuery,
  ImportJobPage,
  NewImportJob,
} from '../entities/import-job.js';
import { toImportJobDetail, toImportJobSummary } from '../mappers/import-job.mapper.js';
import { ImportJobRepository, type OutcomeIssue } from '../repositories/import-job.repository.js';

const IMPORT_JOB_NOT_FOUND = 'Import not found';

/** The import history: one entry per uploaded file, with what it did and why records were left out. */
@Injectable()
export class ImportJobsService {
  constructor(private readonly jobs: ImportJobRepository) {}

  /** Records that a file is being imported and returns the new entry's id. */
  start(workspaceId: string, job: NewImportJob): Promise<string> {
    return this.jobs.create(workspaceId, job);
  }

  complete(workspaceId: string, jobId: string, outcome: ImportOutcome): Promise<void> {
    return this.jobs.complete(workspaceId, jobId, toCounts(outcome), toOutcomeIssues(outcome));
  }

  /** Marks the job failed, with a reason that is safe to show, as the activity log stores it. */
  fail(workspaceId: string, jobId: string, error: unknown): Promise<void> {
    return this.jobs.fail(workspaceId, jobId, toFailureReason(error));
  }

  async list(workspaceId: string, query: ImportJobListQuery): Promise<ImportJobPage> {
    const { rows, nextCursor } = toCursorPage(
      await this.jobs.listPage(workspaceId, query),
      query.limit,
    );
    return { items: rows.map((record) => toImportJobSummary(record)), nextCursor };
  }

  async get(workspaceId: string, jobId: string): Promise<ImportJobDetail> {
    const record = await this.jobs.findDetail(workspaceId, jobId);
    if (!record) {
      throw new NotFoundException(IMPORT_JOB_NOT_FOUND);
    }
    return toImportJobDetail(record);
  }
}

/** Only one of the update counts is set per mode: products for updates, variants for stock. */
function toCounts(outcome: ImportOutcome): ImportJobCounts {
  return {
    created: outcome.createdProducts,
    linked: 0,
    updated: outcome.updatedProducts + outcome.updatedVariants,
    skipped: outcome.skipped.length,
    failed: outcome.failed.length,
  };
}

/** Issues in file order; those without a row (catalog clashes) follow the ones with one. */
function toOutcomeIssues(outcome: ImportOutcome): OutcomeIssue[] {
  const tagged = [
    ...outcome.skipped.map((issue) => ({ outcome: ImportIssueOutcome.SKIPPED, issue })),
    ...outcome.failed.map((issue) => ({ outcome: ImportIssueOutcome.FAILED, issue })),
  ];
  return tagged.sort(
    (left, right) =>
      (left.issue.row ?? Number.MAX_SAFE_INTEGER) - (right.issue.row ?? Number.MAX_SAFE_INTEGER),
  );
}
