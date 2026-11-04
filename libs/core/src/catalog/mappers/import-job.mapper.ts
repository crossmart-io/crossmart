import { findEnumValue, requireEnumValue } from '@crossmart/common';
import type { ImportJobIssue } from '@crossmart/database';
import type {
  ImportJobDetail,
  ImportJobIssueView,
  ImportJobSummary,
} from '../entities/import-job.js';
import { CatalogImportFormat } from '../enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../enums/catalog-import-mode.enum.js';
import { ImportIssueCode } from '../enums/import-issue-code.enum.js';
import type {
  ImportJobDetailRecord,
  ImportJobSummaryRecord,
} from '../repositories/import-job.queries.js';

export function toImportJobSummary(record: ImportJobSummaryRecord): ImportJobSummary {
  return {
    id: record.id,
    mode: requireEnumValue(CatalogImportMode, record.mode),
    format: requireEnumValue(CatalogImportFormat, record.format),
    fileName: record.fileName,
    connectionId: record.connectionId,
    totalCount: record.totalCount,
    status: record.status,
    counts: {
      created: record.createdCount,
      linked: record.linkedCount,
      updated: record.updatedCount,
      skipped: record.skippedCount,
      failed: record.failedCount,
    },
    errorMessage: record.errorMessage,
    actor: {
      userId: record.userId,
      userName: record.user?.name ?? null,
      apiKeyId: record.apiKeyId,
      apiKeyName: record.apiKey?.name ?? null,
    },
    createdAt: record.createdAt,
    finishedAt: record.finishedAt,
  };
}

/** A code retired since the import ran reads as an invalid value rather than failing the page. */
function toIssueView(record: ImportJobIssue): ImportJobIssueView {
  return {
    outcome: record.outcome,
    code: findEnumValue(ImportIssueCode, record.code) ?? ImportIssueCode.InvalidValue,
    message: record.message,
    handle: record.handle ?? undefined,
    sku: record.sku ?? undefined,
    row: record.row ?? undefined,
  };
}

export function toImportJobDetail(record: ImportJobDetailRecord): ImportJobDetail {
  return { ...toImportJobSummary(record), issues: record.issues.map(toIssueView) };
}
