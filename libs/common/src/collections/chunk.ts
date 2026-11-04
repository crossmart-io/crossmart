/** Splits items into consecutive batches of at most `size`, keeping their order. */
export function chunk<TItem>(items: readonly TItem[], size: number): TItem[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`Batch size must be a positive integer, not ${size}`);
  }
  const batches: TItem[][] = [];
  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }
  return batches;
}
