import type { ImportIssue } from '../entities/catalog-import.js';
import type { ImportOutcome } from '../entities/catalog-import.js';

/** Fills in the row of issues found against the catalog, which only know the product handle. */
export function withRows(
  issues: ImportIssue[],
  rowByHandle: ReadonlyMap<string, number>,
): ImportIssue[] {
  return issues.map((issue) =>
    issue.row === undefined && issue.handle !== undefined
      ? { ...issue, row: rowByHandle.get(issue.handle) }
      : issue,
  );
}

/** An outcome with nothing done, for strategies to fill in what their mode touches. */
export function emptyOutcome(): ImportOutcome {
  return {
    createdProducts: 0,
    createdVariants: 0,
    updatedProducts: 0,
    updatedVariants: 0,
    skipped: [],
    failed: [],
  };
}
