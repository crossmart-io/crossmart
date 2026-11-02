import { BadRequestException } from '@nestjs/common';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import { InventoryCsvParser } from './inventory-csv.parser.js';

const parser = new InventoryCsvParser();

function csv(...lines: string[]): Buffer {
  return Buffer.from(lines.join('\n'));
}

describe('InventoryCsvParser', () => {
  it('reads SKUs and quantities with their row numbers, ignoring header case', () => {
    const { levels, issues } = parser.parse(csv(' SKU ,Available', 'MUG-1,12', ' TEE-M , 0 '));

    expect(issues).toEqual([]);
    expect(levels).toEqual([
      { sku: 'MUG-1', available: 12, row: 2 },
      { sku: 'TEE-M', available: 0, row: 3 },
    ]);
  });

  it('reports each bad row on its own and keeps the good ones', () => {
    const { levels, issues } = parser.parse(
      csv('sku,available', 'A,5', ',3', 'B,-1', 'C,2.5', 'D,', 'A,7', 'E,99999999999'),
    );

    expect(levels.map((level) => level.sku)).toEqual(['A']);
    expect(issues).toEqual([
      expect.objectContaining({ row: 3, code: ImportIssueCode.MissingValue }),
      expect.objectContaining({ row: 4, sku: 'B', code: ImportIssueCode.InvalidValue }),
      expect.objectContaining({ row: 5, sku: 'C', code: ImportIssueCode.InvalidValue }),
      expect.objectContaining({ row: 6, sku: 'D', code: ImportIssueCode.MissingValue }),
      expect.objectContaining({ row: 7, sku: 'A', code: ImportIssueCode.DuplicateRow }),
      expect.objectContaining({ row: 8, sku: 'E', code: ImportIssueCode.InvalidValue }),
    ]);
  });

  it('refuses a file without the sku and available columns', () => {
    expect(() => parser.parse(csv('Handle,Title', 'mug,Mug'))).toThrow(BadRequestException);
    expect(() => parser.parse(csv('sku,available'))).toThrow(BadRequestException);
  });
});
