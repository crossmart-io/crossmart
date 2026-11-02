import { AMOUNT_FRACTION_DIGITS } from '@crossmart/common';
import type { Prisma } from '@crossmart/database';

/** A stored money amount as the exact decimal string the API and drafts use, e.g. "89.00". */
export function toAmount(value: Prisma.Decimal): string {
  return value.toFixed(AMOUNT_FRACTION_DIGITS);
}
