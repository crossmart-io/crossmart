/**
 * Which page of a list to read: a page number for tables that jump between pages, or the
 * `nextCursor` of the previous page for clients that read on. A page number wins over a cursor.
 */
export interface PageRequest {
  limit: number;
  cursor?: string;
  /** 1-based. */
  page?: number;
}

/** The rows of one list query, and how many match it in all. */
export interface CountedRecords<Row> {
  records: Row[];
  total: number;
}

/** Prisma's `take`, `skip` and `cursor` for one page, plus one extra row that says if more exist. */
export interface PageWindow {
  take: number;
  skip?: number;
  cursor?: { id: string };
}

export function toPageWindow({ limit, cursor, page }: PageRequest): PageWindow {
  const take = limit + 1;
  if (page !== undefined) return { take, skip: (page - 1) * limit };
  return cursor ? { take, cursor: { id: cursor }, skip: 1 } : { take };
}
