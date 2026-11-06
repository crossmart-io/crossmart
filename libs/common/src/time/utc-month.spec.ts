import { utcMonthContaining } from './utc-month.js';

describe('utcMonthContaining', () => {
  it('spans the UTC calendar month, across a year end', () => {
    expect(utcMonthContaining(new Date('2026-12-31T23:59:59Z'))).toEqual({
      from: new Date('2026-12-01T00:00:00Z'),
      to: new Date('2027-01-01T00:00:00Z'),
    });
  });
});
