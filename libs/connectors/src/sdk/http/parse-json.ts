/** Parses a response body, or returns null when it is not JSON. Never throws. */
export function parseJsonBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
