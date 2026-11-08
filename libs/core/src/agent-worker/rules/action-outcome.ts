import { JSON_INDENTATION } from '../../agent-tools/agent-tools.constants.js';

const ITEMS_KEY = 'items';
const TOTAL_KEY = 'total';
const DONE = 'Done';

function countOf(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record[TOTAL_KEY] === 'number') return record[TOTAL_KEY];
  const items = record[ITEMS_KEY];
  return Array.isArray(items) ? items.length : null;
}

/**
 * A call's outcome in a few words for the chat, such as "12 found", without repeating data the
 * card does not need. Refusals keep their first line, which is the API's message.
 */
export function describeOutcome(value: unknown, isError: boolean, text: string): string {
  if (isError) return text.split('\n')[0] ?? text;
  const count = countOf(value);
  if (count !== null) return `${count} found`;
  return DONE;
}

/** A value as one readable string for a before and after view. */
export function displayValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value.join(', ');
  }
  return JSON.stringify(value, null, JSON_INDENTATION);
}
