/** Which way a list is sorted. The values match Prisma's, so they can be passed through. */
export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export type SortOrder<Field extends string> = { [Key in Field | 'id']?: SortDirection }[];

/**
 * Orders by `field`, then by id in the same direction. The id makes the order total, which
 * cursor pages need: rows that tie on `field` would otherwise repeat or go missing.
 */
export function sortWithTiebreak<Field extends string>(
  field: Field,
  direction: SortDirection,
): SortOrder<Field> {
  // A computed key widens to `string`; it is the caller's `field`, so the narrower type holds.
  const byField = { [field]: direction } as SortOrder<Field>[number];
  const byId: SortOrder<Field>[number] = { id: direction };
  return [byField, byId];
}
