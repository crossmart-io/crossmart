/** A value of a log line; absent ones are left out of the line. */
export type LogValue = string | number | undefined;

/** Values safe to write without quotes: ids, URLs, tool names, numbers. */
const BARE_VALUE = /^[\w.:/@-]+$/;

function formatValue(value: string | number): string {
  if (typeof value === 'number' || BARE_VALUE.test(value)) return String(value);
  return JSON.stringify(value);
}

/**
 * One `key=value` line, in the order given. A value with spaces or quotes is written as a JSON
 * string, so a client-chosen value can never break the line or start a new one.
 */
export function logLine(fields: Readonly<Record<string, LogValue>>): string {
  return Object.entries(fields)
    .flatMap(([key, value]) => (value === undefined ? [] : [`${key}=${formatValue(value)}`]))
    .join(' ');
}
