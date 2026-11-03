import type { SortDirection } from '@crossmart/common';
import type { ImportIssueOutcome, ImportJobStatus } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import type { CatalogImportFormat } from '../enums/catalog-import-format.enum.js';
import type { CatalogImportMode } from '../enums/catalog-import-mode.enum.js';
import type { ImportIssue } from './catalog-import.js';

/**
 * Who sent the file: a user or an API key, as the activity log credits it. The names are null
 * once the user or key is deleted.
 */
export interface ImportJobActor {
  userId: string | null;
  userName: string | null;
  apiKeyId: string | null;
  apiKeyName: string | null;
}

/**
 * Records per outcome. A record is a product for create, update and channel imports, and a
 * variant's stock row for inventory imports.
 */
export interface ImportJobCounts {
  created: number;
  /** Channel products linked to the catalog products they matched; zero for file imports. */
  linked: number;
  /** For channel imports: products already linked, whose listing was refreshed. */
  updated: number;
  skipped: number;
  failed: number;
}

/** One entry of the import history. */
export interface ImportJobSummary {
  id: string;
  mode: CatalogImportMode;
  format: CatalogImportFormat;
  /** The file's name, or the channel account's name for a channel import. */
  fileName: string;
  /** The channel connection a channel import reads; null for file imports. */
  connectionId: string | null;
  /** Records the source holds, when known, for progress; null for file imports. */
  totalCount: number | null;
  status: ImportJobStatus;
  counts: ImportJobCounts;
  /** Why the whole file was rejected; null unless the job failed. */
  errorMessage: string | null;
  actor: ImportJobActor;
  createdAt: Date;
  finishedAt: Date | null;
}

export interface ImportJobIssueView extends ImportIssue {
  outcome: ImportIssueOutcome;
}

export interface ImportJobDetail extends ImportJobSummary {
  /** Skipped and failed records, in file order. */
  issues: ImportJobIssueView[];
}

export interface ImportJobListQuery {
  status?: ImportJobStatus;
  /** Where the records came from: a file of one format, or a channel. */
  format?: CatalogImportFormat;
  /** By start time; newest first by default. */
  direction?: SortDirection;
  cursor?: string;
  /** 1-based page number, for tables; it wins over `cursor`. */
  page?: number;
  limit: number;
}

export interface ImportJobPage {
  items: ImportJobSummary[];
  /** Pass as `cursor` to get the next page; null on the last page. */
  nextCursor: string | null;
  /** How many match in all, for page numbers. */
  total: number;
}

/** What is known about an import before its file is read. */
export interface NewImportJob {
  mode: CatalogImportMode;
  format: CatalogImportFormat;
  fileName: string;
  actor: Actor;
  /** Set for channel imports. */
  connectionId?: string;
}
