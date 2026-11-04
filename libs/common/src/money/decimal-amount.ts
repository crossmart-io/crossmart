/** Prices are kept as exact decimal strings with two fraction digits, never as floats. */
export const AMOUNT_FRACTION_DIGITS = 2;

/** Up to 10 integer digits, matching `Decimal(12, 2)` columns. */
export const AMOUNT_PATTERN = /^(\d{1,10})(?:\.(\d{1,2}))?$/;

/** "89" → "89.00", "4.5" → "4.50". Returns null for anything that is not a non-negative amount. */
export function normalizeAmount(input: string): string | null {
  const match = AMOUNT_PATTERN.exec(input.trim());
  if (!match) {
    return null;
  }
  const [, whole, fraction = ''] = match;
  const integerPart = whole.replace(/^0+(?=\d)/, '');
  return `${integerPart}.${fraction.padEnd(AMOUNT_FRACTION_DIGITS, '0')}`;
}
