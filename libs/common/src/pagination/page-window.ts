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

/**
 * The same window as `toPageWindow`, taken from ids already in order in memory: the page's ids
 * plus one more when another page exists. An unknown cursor gives an empty page, as Prisma does.
 */
export function slicePageWindow(ids: readonly string[], request: PageRequest): string[] {
  const { take, skip = 0, cursor } = toPageWindow(request);
  const start = cursor ? ids.indexOf(cursor.id) : 0;
  if (start < 0) return [];
  return ids.slice(start + skip, start + skip + take);
}
