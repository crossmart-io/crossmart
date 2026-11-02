import { normalizeAmount } from './decimal-amount.js';

describe('normalizeAmount', () => {
  it.each([
    ['89', '89.00'],
    ['89.0', '89.00'],
    ['4.5', '4.50'],
    [' 12.99 ', '12.99'],
    ['007.10', '7.10'],
    ['0', '0.00'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeAmount(input)).toBe(expected);
  });

  it.each(['', 'abc', '-1', '1.999', '1,000.00', '$5', '12345678901'])('rejects %j', (input) => {
    expect(normalizeAmount(input)).toBeNull();
  });
});
