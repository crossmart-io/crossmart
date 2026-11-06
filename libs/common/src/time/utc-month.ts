/** A half-open time window: from `from` (included) to `to` (excluded). */
export interface TimeWindow {
  from: Date;
  to: Date;
}

const NEXT_MONTH = 1;

/** The calendar month (UTC) that contains `now`: its first instant to the next month's. */
export function utcMonthContaining(now: Date): TimeWindow {
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth())),
    to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + NEXT_MONTH)),
  };
}
