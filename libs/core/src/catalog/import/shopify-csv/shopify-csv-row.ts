import { normalizeAmount } from '@crossmart/common';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import type { ShopifyCsvColumn } from './shopify-csv-column.enum.js';

const TRUE_VALUE = 'true';
const FALSE_VALUE = 'false';
const INTEGER_PATTERN = /^-?\d+$/;
const WEB_PROTOCOLS: readonly string[] = ['http:', 'https:'];

/** A problem with one cell. The parser turns it into an issue for the whole product. */
export class ShopifyRowError extends Error {
  constructor(
    readonly code: ImportIssueCode,
    message: string,
    readonly row: number,
  ) {
    super(message);
    this.name = 'ShopifyRowError';
  }
}

/** Typed access to the cells of one CSV row. Readers throw `ShopifyRowError` on bad values. */
export class ShopifyCsvRow {
  constructor(
    readonly row: number,
    private readonly cells: Readonly<Record<string, string | undefined>>,
  ) {}

  text(column: ShopifyCsvColumn): string | undefined {
    const value = this.cells[column]?.trim();
    return value ? value : undefined;
  }

  requiredText(column: ShopifyCsvColumn): string {
    const value = this.text(column);
    if (value === undefined) {
      throw this.error(ImportIssueCode.MissingValue, `${column} is empty`);
    }
    return value;
  }

  /** The raw cell, untrimmed: HTML descriptions keep their whitespace. */
  raw(column: ShopifyCsvColumn): string {
    return this.cells[column] ?? '';
  }

  boolean(column: ShopifyCsvColumn, fallback: boolean): boolean {
    const value = this.text(column)?.toLowerCase();
    if (value === undefined) return fallback;
    if (value === TRUE_VALUE) return true;
    if (value === FALSE_VALUE) return false;
    throw this.error(ImportIssueCode.InvalidValue, `${column} must be TRUE or FALSE`);
  }

  integer(column: ShopifyCsvColumn): number | undefined {
    const value = this.text(column);
    if (value === undefined) return undefined;
    if (!INTEGER_PATTERN.test(value)) {
      throw this.error(ImportIssueCode.InvalidValue, `${column} must be a whole number`);
    }
    return Number.parseInt(value, 10);
  }

  /** An absolute http(s) URL. Other schemes (file:, data:) are rejected. */
  url(column: ShopifyCsvColumn): string | undefined {
    const value = this.text(column);
    if (value === undefined) return undefined;
    if (!URL.canParse(value) || !WEB_PROTOCOLS.includes(new URL(value).protocol)) {
      throw this.error(ImportIssueCode.InvalidValue, `${column} must be an http or https URL`);
    }
    return value;
  }

  amount(column: ShopifyCsvColumn): string | undefined {
    const value = this.text(column);
    if (value === undefined) return undefined;
    const amount = normalizeAmount(value);
    if (amount === null) {
      throw this.error(ImportIssueCode.InvalidValue, `${column} "${value}" is not a valid price`);
    }
    return amount;
  }

  requiredAmount(column: ShopifyCsvColumn): string {
    const amount = this.amount(column);
    if (amount === undefined) {
      throw this.error(ImportIssueCode.MissingValue, `${column} is empty`);
    }
    return amount;
  }

  error(code: ImportIssueCode, message: string): ShopifyRowError {
    return new ShopifyRowError(code, message, this.row);
  }
}
