import { FixedDecimal, RoundingMode } from './fixed-decimal.js';

const of = (text: string) => FixedDecimal.of(text);

describe('FixedDecimal', () => {
  it('parses signed decimals and rejects anything else', () => {
    expect(of('89').toFixed(2)).toBe('89.00');
    expect(of('-2.5').toFixed(2)).toBe('-2.50');
    expect(of(' 0.000001 ').toString()).toBe('0.000001');
    for (const text of ['', 'abc', '1.0000001', '1,5', '$5', '1e3']) {
      expect(FixedDecimal.parse(text)).toBeNull();
    }
    expect(() => of('x')).toThrow(RangeError);
  });

  it('adds and multiplies exactly, where floats would drift', () => {
    expect(of('0.1').plus(of('0.2')).toString()).toBe('0.3');
    expect(of('19.99').times(of('3')).toFixed(2)).toBe('59.97');
    expect(of('10').minus(of('12.5')).toString()).toBe('-2.5');
  });

  it('moves a value by a percentage', () => {
    expect(of('89').adjustedByPercent(of('15')).toFixed(2)).toBe('102.35');
    expect(of('89').adjustedByPercent(of('-10')).toFixed(2)).toBe('80.10');
    expect(of('0.07').adjustedByPercent(of('12.5')).toString()).toBe('0.07875');
  });

  it.each([
    ['1.005', 2, RoundingMode.HalfUp, '1.01'],
    ['1.004', 2, RoundingMode.HalfUp, '1.00'],
    ['-1.005', 2, RoundingMode.HalfUp, '-1.01'],
    ['1.001', 2, RoundingMode.Up, '1.01'],
    ['-1.001', 2, RoundingMode.Up, '-1.00'],
    ['1.009', 2, RoundingMode.Down, '1.00'],
    ['-1.001', 2, RoundingMode.Down, '-1.01'],
    ['102.35', 0, RoundingMode.Up, '103'],
    ['102', 0, RoundingMode.Up, '102'],
  ])('rounds %s to %i digits %s as %s', (text, digits, mode, expected) => {
    expect(of(text).round(digits, mode).toFixed(digits)).toBe(expected);
  });

  it('compares and clamps', () => {
    expect(of('1.10').compare(of('1.1'))).toBe(0);
    expect(of('1').lessThan(of('1.01'))).toBe(true);
    expect(of('-3').abs().toString()).toBe('3');
    expect(of('-3').max(FixedDecimal.ZERO).isZero()).toBe(true);
    expect(FixedDecimal.step(2).toString()).toBe('0.01');
  });
});
