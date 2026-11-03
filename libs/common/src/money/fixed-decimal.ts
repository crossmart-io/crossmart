/** Fraction digits every value carries internally: enough for percentages of cent amounts. */
export const FIXED_DECIMAL_SCALE = 6;

/** A signed decimal with up to `FIXED_DECIMAL_SCALE` fraction digits: "-12.5", "0.000001". */
export const FIXED_DECIMAL_PATTERN = /^(-)?(\d{1,15})(?:\.(\d{1,6}))?$/;

const NO_UNITS = 0n;
const ONE_UNIT = 1n;
const TWO = 2n;
const TEN = 10n;
const HUNDRED = 100n;
const UNITS_PER_ONE = TEN ** BigInt(FIXED_DECIMAL_SCALE);
const DECIMAL_POINT = '.';
const MINUS = '-';

/** Which way a value that does not fit the requested precision moves. */
export enum RoundingMode {
  /** To the nearest, halves away from zero: 1.005 → 1.01. */
  HalfUp = 'half_up',
  /** Towards positive infinity: 1.001 → 1.01. */
  Up = 'up',
  /** Towards negative infinity: 1.009 → 1.00. */
  Down = 'down',
}

function powerOfTen(exponent: number): bigint {
  return TEN ** BigInt(exponent);
}

/** Divides, rounding the quotient as `mode` says. The divisor is positive. */
function divideRounded(dividend: bigint, divisor: bigint, mode: RoundingMode): bigint {
  const quotient = dividend / divisor;
  const remainder = dividend % divisor;
  if (remainder === NO_UNITS) return quotient;
  const negative = dividend < NO_UNITS;
  switch (mode) {
    case RoundingMode.Down:
      return negative ? quotient - ONE_UNIT : quotient;
    case RoundingMode.Up:
      return negative ? quotient : quotient + ONE_UNIT;
    case RoundingMode.HalfUp: {
      const twiceRemainder = (negative ? -remainder : remainder) * TWO;
      if (twiceRemainder < divisor) return quotient;
      return negative ? quotient - ONE_UNIT : quotient + ONE_UNIT;
    }
  }
}

/**
 * An exact decimal for money and percentages, backed by an integer count of millionths, so
 * prices are never touched by floating-point error. Immutable: every operation returns a new
 * value. Parse amounts from their decimal strings and format them back with `toFixed`.
 */
export class FixedDecimal {
  static readonly ZERO = new FixedDecimal(NO_UNITS);
  static readonly ONE_HUNDRED = new FixedDecimal(HUNDRED * UNITS_PER_ONE);

  private constructor(private readonly units: bigint) {}

  /** The value of a decimal string, or null when it is not one. */
  static parse(text: string): FixedDecimal | null {
    const match = FIXED_DECIMAL_PATTERN.exec(text.trim());
    if (!match) return null;
    const [, sign, whole, fraction = ''] = match;
    const fractionUnits = fraction.padEnd(FIXED_DECIMAL_SCALE, '0');
    const units = BigInt(whole) * UNITS_PER_ONE + BigInt(fractionUnits);
    return new FixedDecimal(sign ? -units : units);
  }

  /** Like `parse`, for values that are known to be valid, such as stored amounts. */
  static of(text: string): FixedDecimal {
    const value = FixedDecimal.parse(text);
    if (!value) {
      throw new RangeError(`Not a decimal: ${text}`);
    }
    return value;
  }

  static fromInteger(value: number): FixedDecimal {
    return new FixedDecimal(BigInt(Math.trunc(value)) * UNITS_PER_ONE);
  }

  plus(other: FixedDecimal): FixedDecimal {
    return new FixedDecimal(this.units + other.units);
  }

  minus(other: FixedDecimal): FixedDecimal {
    return new FixedDecimal(this.units - other.units);
  }

  /** The product, rounded half up to the internal scale. */
  times(other: FixedDecimal): FixedDecimal {
    return new FixedDecimal(
      divideRounded(this.units * other.units, UNITS_PER_ONE, RoundingMode.HalfUp),
    );
  }

  /** The value moved by `percent`: 89 moved by 15 is 102.35, moved by -10 is 80.10. */
  adjustedByPercent(percent: FixedDecimal): FixedDecimal {
    const factorUnits = HUNDRED * UNITS_PER_ONE + percent.units;
    const scaledDivisor = HUNDRED * UNITS_PER_ONE;
    return new FixedDecimal(
      divideRounded(this.units * factorUnits, scaledDivisor, RoundingMode.HalfUp),
    );
  }

  /** Rounds to `digits` fraction digits (0 for whole units). */
  round(digits: number, mode: RoundingMode): FixedDecimal {
    const step = powerOfTen(FIXED_DECIMAL_SCALE - digits);
    return new FixedDecimal(divideRounded(this.units, step, mode) * step);
  }

  /** The smallest step at `digits` fraction digits: 0.01 for 2, 1 for 0. */
  static step(digits: number): FixedDecimal {
    return new FixedDecimal(powerOfTen(FIXED_DECIMAL_SCALE - digits));
  }

  compare(other: FixedDecimal): number {
    if (this.units === other.units) return 0;
    return this.units < other.units ? -1 : 1;
  }

  lessThan(other: FixedDecimal): boolean {
    return this.units < other.units;
  }

  greaterThan(other: FixedDecimal): boolean {
    return this.units > other.units;
  }

  abs(): FixedDecimal {
    return this.units < NO_UNITS ? new FixedDecimal(-this.units) : this;
  }

  isNegative(): boolean {
    return this.units < NO_UNITS;
  }

  isZero(): boolean {
    return this.units === NO_UNITS;
  }

  max(other: FixedDecimal): FixedDecimal {
    return this.lessThan(other) ? other : this;
  }

  /** The shortest exact form, without trailing zeros: "15", "-2.5", "0.125". */
  toString(): string {
    const text = this.toFixed(FIXED_DECIMAL_SCALE);
    return text.replace(/\.?0+$/, '');
  }

  /** Rounded half up to `digits` fraction digits, as a plain decimal string: "102.99". */
  toFixed(digits: number): string {
    const rounded = this.round(digits, RoundingMode.HalfUp).units;
    const magnitude = rounded < NO_UNITS ? -rounded : rounded;
    const whole = magnitude / UNITS_PER_ONE;
    const fraction = (magnitude % UNITS_PER_ONE).toString().padStart(FIXED_DECIMAL_SCALE, '0');
    const sign = rounded < NO_UNITS ? MINUS : '';
    return digits === 0
      ? `${sign}${whole}`
      : `${sign}${whole}${DECIMAL_POINT}${fraction.slice(0, digits)}`;
  }
}
