import { SELLER_CENTER_DATE_PATTERN } from '../falabella.constants.js';

const TIME_ZONE_LOCALE = 'en-US';
const HOUR_CYCLE = 'h23';

/** How far `timeZone` is ahead of UTC at `instant`, in milliseconds. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat(TIME_ZONE_LOCALE, {
    timeZone,
    hourCycle: HOUR_CYCLE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  const wallClock = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  return wallClock - instant;
}

/**
 * A Seller Center time (`2025-04-03 12:00:00`), which carries no zone, read in the country's
 * time zone. ISO 8601 times with a zone are read as they are.
 */
export function sellerCenterDate(text: string, timeZone: string): Date {
  const match = SELLER_CENTER_DATE_PATTERN.exec(text);
  if (!match) return new Date(text);
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(asUtc - zoneOffsetMs(asUtc, timeZone));
}
