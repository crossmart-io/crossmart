import { currencyFractionDigits, formatCurrency } from './currency.js';

describe('currency', () => {
  it('knows each currency’s minor units', () => {
    expect(currencyFractionDigits('USD')).toBe(2);
    expect(currencyFractionDigits('JPY')).toBe(0);
    expect(currencyFractionDigits('KWD')).toBe(3);
    expect(currencyFractionDigits('not-a-code')).toBe(2);
  });

  it('formats exact decimal strings as money', () => {
    expect(formatCurrency('102.99', 'USD')).toBe('$102.99');
    expect(formatCurrency('1234', 'JPY')).toBe('¥1,234');
    expect(formatCurrency('5.00', 'not-a-code')).toBe('5.00 not-a-code');
  });
});
