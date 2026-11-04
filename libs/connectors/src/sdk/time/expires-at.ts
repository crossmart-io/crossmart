import { MILLISECONDS_PER_SECOND } from './time.constants.js';

/** When a token that lives `seconds` from `now` expires, as an ISO string; undefined without one. */
export function expiresAt(now: Date, seconds: number | undefined): string | undefined {
  return seconds === undefined
    ? undefined
    : new Date(now.getTime() + seconds * MILLISECONDS_PER_SECOND).toISOString();
}
