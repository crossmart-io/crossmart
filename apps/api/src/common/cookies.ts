const COOKIE_SEPARATOR = ';';
const NAME_VALUE_SEPARATOR = '=';

/** The value of one cookie in a `Cookie` header, decoded; null when the browser did not send it. */
export function readCookie(header: string | undefined, name: string): string | null {
  for (const pair of header?.split(COOKIE_SEPARATOR) ?? []) {
    const separator = pair.indexOf(NAME_VALUE_SEPARATOR);
    if (separator > 0 && pair.slice(0, separator).trim() === name) {
      return decodeCookieValue(pair.slice(separator + 1).trim());
    }
  }
  return null;
}

function decodeCookieValue(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
