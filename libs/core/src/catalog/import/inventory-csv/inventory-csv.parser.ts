import { Injectable } from '@nestjs/common';
import { MAX_STOCK_QUANTITY } from '../../../inventory/inventory.constants.js';
import type {
  ImportIssue,
  StockFileParser,
  StockLevelDraft,
  StockParseResult,
} from '../../entities/catalog-import.js';
import { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import {
  assertCsvColumns,
  type CsvRecord,
  FIRST_DATA_ROW,
  readCsvRecords,
} from '../csv/csv-records.js';
import { INVENTORY_CSV_COLUMNS, InventoryCsvColumn } from './inventory-csv-column.enum.js';

const INVENTORY_FILE_KIND = 'an inventory CSV';
const WHOLE_NUMBER_PATTERN = /^\d+$/;

/**
 * Reads a `sku,available` sheet: one row per variant. Each row is checked on its own, so one
 * bad row never stops the rest. A SKU listed twice keeps its first row.
 */
@Injectable()
export class InventoryCsvParser implements StockFileParser {
  readonly format = CatalogImportFormat.InventoryCsv;

  parse(content: Buffer): StockParseResult {
    const records = readCsvRecords(content, { normalizeHeader: normalizeHeader });
    assertCsvColumns(records, INVENTORY_CSV_COLUMNS, INVENTORY_FILE_KIND);
    const result: StockParseResult = { levels: [], issues: [] };
    const firstRowBySku = new Map<string, number>();
    for (const [index, record] of records.entries()) {
      const outcome = this.readRow(record, index + FIRST_DATA_ROW, firstRowBySku);
      if ('issue' in outcome) {
        result.issues.push(outcome.issue);
      } else {
        result.levels.push(outcome.level);
      }
    }
    return result;
  }

  private readRow(
    record: CsvRecord,
    row: number,
    firstRowBySku: Map<string, number>,
  ): { level: StockLevelDraft } | { issue: ImportIssue } {
    const sku = record[InventoryCsvColumn.Sku]?.trim();
    if (!sku) {
      return { issue: { code: ImportIssueCode.MissingValue, message: 'SKU is empty', row } };
    }
    const earlierRow = firstRowBySku.get(sku);
    if (earlierRow !== undefined) {
      const message = `Already on row ${earlierRow}; this row was ignored`;
      return { issue: { code: ImportIssueCode.DuplicateRow, message, sku, row } };
    }
    firstRowBySku.set(sku, row);
    const available = record[InventoryCsvColumn.Available]?.trim() ?? '';
    const problem = this.quantityProblem(available);
    if (problem) {
      return { issue: { ...problem, sku, row } };
    }
    return { level: { sku, available: Number.parseInt(available, 10), row } };
  }

  private quantityProblem(value: string): Pick<ImportIssue, 'code' | 'message'> | undefined {
    if (!value) {
      return { code: ImportIssueCode.MissingValue, message: 'Available is empty' };
    }
    if (!WHOLE_NUMBER_PATTERN.test(value)) {
      return {
        code: ImportIssueCode.InvalidValue,
        message: `Available "${value}" must be a whole number of 0 or more`,
      };
    }
    if (Number(value) > MAX_STOCK_QUANTITY) {
      return { code: ImportIssueCode.InvalidValue, message: `Available ${value} is too large` };
    }
    return undefined;
  }
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}
