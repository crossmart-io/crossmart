const CURRENCY_LOCALE = 'en-US';
const CURRENCY_STYLE = 'currency';
/** ISO 4217 minor units for the rare code the runtime does not know. */
const FALLBACK_FRACTION_DIGITS = 2;

function currencyFormat(currencyCode: string): Intl.NumberFormat | null {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: CURRENCY_STYLE,
      currency: currencyCode,
    });
  } catch {
    return null;
  }
}

/** The currency's minor units: 2 for USD, 0 for JPY, 3 for KWD. */
export function currencyFractionDigits(currencyCode: string): number {
  return (
    currencyFormat(currencyCode)?.resolvedOptions().maximumFractionDigits ??
    FALLBACK_FRACTION_DIGITS
  );
}

/** An exact decimal string as money: "102.99" → "$102.99". Never goes through a float. */
export function formatCurrency(amount: string, currencyCode: string): string {
  const format = currencyFormat(currencyCode);
  return format ? format.format(amount as Intl.StringNumericLiteral) : `${amount} ${currencyCode}`;
}
