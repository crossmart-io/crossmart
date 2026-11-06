/** Raised by `withTimeout` when the work did not settle in time. */
export class TimeoutError extends Error {
  override readonly name = 'TimeoutError';

  constructor(readonly timeoutMs: number) {
    super(`Timed out after ${timeoutMs} ms`);
  }
}

/**
 * Settles like `work`, or rejects with a `TimeoutError` when it takes longer than `timeoutMs`.
 * The work itself keeps running; only the wait is cut short.
 */
export async function withTimeout<TResult>(
  work: Promise<TResult>,
  timeoutMs: number,
): Promise<TResult> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(timeoutMs)), timeoutMs);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
