import { BadRequestException } from '@nestjs/common';
import { parse as parseCsv } from 'csv-parse/sync';
import { IMPORT_MAX_ROWS } from '../../catalog.constants.js';

/** One CSV record keyed by its header names. */
export type CsvRecord = Record<string, string>;

/** The header is spreadsheet row 1, so the first record is row 2. */
export const FIRST_DATA_ROW = 2;

export interface CsvReadOptions {
  /** Rewrites the header names before they become keys, e.g. to ignore case. */
  normalizeHeader?: (header: string) => string;
}

/** Reads a CSV with a header row. Throws a 400 for unreadable files and files over the row limit. */
export function readCsvRecords(content: Buffer, options: CsvReadOptions = {}): CsvRecord[] {
  const { normalizeHeader } = options;
  let records: CsvRecord[];
  try {
    records = parseCsv(content, {
      columns: normalizeHeader ? (header: string[]) => header.map(normalizeHeader) : true,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
  } catch {
    throw new BadRequestException('The file is not a readable CSV');
  }
  if (records.length > IMPORT_MAX_ROWS) {
    throw new BadRequestException(`The file has more than ${IMPORT_MAX_ROWS} rows`);
  }
  return records;
}

/** Throws a 400 naming the columns the first record lacks; `fileKind` describes the expected file. */
export function assertCsvColumns(
  records: CsvRecord[],
  required: readonly string[],
  fileKind: string,
): void {
  const [firstRecord] = records;
  const missing = required.filter((column) => !firstRecord || !(column in firstRecord));
  if (missing.length > 0) {
    throw new BadRequestException(
      `This does not look like ${fileKind}: missing ${missing.join(', ')}`,
    );
  }
}
