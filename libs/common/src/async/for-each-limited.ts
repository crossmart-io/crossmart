/**
 * Runs `task` on every item with at most `limit` running at once, and waits for all of them.
 * The first failure rejects, after the tasks already started have settled.
 */
export async function forEachLimited<TItem>(
  items: readonly TItem[],
  limit: number,
  task: (item: TItem) => Promise<void>,
): Promise<void> {
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await task(item);
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  const results = await Promise.allSettled(workers);
  const failure = results.find((result) => result.status === 'rejected');
  if (failure) throw failure.reason;
}
