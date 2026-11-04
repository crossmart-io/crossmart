import type { CountedRecords } from './page-window.js';

export interface CursorPage<Row> {
  rows: Row[];
  /** The id to pass as `cursor` for the next page; null on the last page. */
  nextCursor: string | null;
}

/** A page that also says how many rows match in all, for tables with page numbers. */
export interface CountedPage<Row> extends CursorPage<Row> {
  total: number;
}

/**
 * Turns a cursor query that fetched `limit + 1` rows into one page. The extra row only says
 * whether another page exists, and the last row returned becomes the next cursor.
 */
export function toCursorPage<Row extends { id: string }>(
  records: Row[],
  limit: number,
): CursorPage<Row> {
  const hasMore = records.length > limit;
  const rows = hasMore ? records.slice(0, limit) : records;
  return { rows, nextCursor: hasMore ? (rows.at(-1)?.id ?? null) : null };
}

/** `toCursorPage` for a query that also counted its matches. */
export function toCountedPage<Row extends { id: string }>(
  { records, total }: CountedRecords<Row>,
  limit: number,
): CountedPage<Row> {
  return { ...toCursorPage(records, limit), total };
}
