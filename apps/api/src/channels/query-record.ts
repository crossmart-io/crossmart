/**
 * Keeps the single-valued string parameters of a parsed query. Channels sign plain
 * `key=value` pairs, so repeated or nested parameters are dropped rather than guessed at.
 */
export function toQueryRecord(query: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

/** Node reports repeated headers as arrays; webhooks only use the first value. */
export function toHeaderRecord(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name, Array.isArray(value) ? value[0] : value]),
  );
}
