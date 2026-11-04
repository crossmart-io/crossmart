const PAIR_SEPARATOR = '&';
const KEY_VALUE_SEPARATOR = '=';

/**
 * Encodes parameters for a query string or a form body with `%20` for spaces. Some channels
 * (eBay) expect percent-encoded spaces in scope lists, while `URLSearchParams` writes `+`.
 */
export function encodeParams(params: Readonly<Record<string, string>>): string {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}${KEY_VALUE_SEPARATOR}${encodeURIComponent(value)}`,
    )
    .join(PAIR_SEPARATOR);
}
