import type { StockFileParser, StockParseResult } from '../../entities/catalog-import.js';
import { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import { InventoryMovementReason } from '@crossmart/database';
import type { StockLevelsService } from '../../../inventory/services/stock-levels.service.js';
import { UpdateStockStrategy } from './update-stock.strategy.js';
import { IMPORT_ACTOR, importRequest } from './__testing__/import-request.factory.js';

const WORKSPACE_ID = 'ws-1';

function setup(parsed: StockParseResult) {
  const inventory = {
    findBySkus: vi.fn<StockLevelsService['findBySkus']>().mockResolvedValue([
      { inventoryItemId: 'item-mug', productId: 'product-mug', sku: 'MUG-1', tracked: true },
      { inventoryItemId: 'item-gift', productId: 'product-gift', sku: 'GIFT-1', tracked: false },
    ]),
    setAvailable: vi.fn<StockLevelsService['setAvailable']>().mockResolvedValue(),
  };
  const parser: StockFileParser = { format: CatalogImportFormat.InventoryCsv, parse: () => parsed };
  const strategy = new UpdateStockStrategy([parser], inventory as unknown as StockLevelsService);
  return { strategy, inventory };
}

describe('UpdateStockStrategy', () => {
  it('sets tracked stock, skips untracked variants and fails unknown SKUs, in row order', async () => {
    const { strategy, inventory } = setup({
      levels: [
        { sku: 'MUG-1', available: 12, row: 2 },
        { sku: 'GIFT-1', available: 5, row: 3 },
        { sku: 'GONE-1', available: 1, row: 5 },
      ],
      issues: [{ code: ImportIssueCode.InvalidValue, message: 'bad', sku: 'X', row: 4 }],
    });

    const outcome = await strategy.run(
      WORKSPACE_ID,
      importRequest(CatalogImportFormat.InventoryCsv),
    );

    expect(inventory.findBySkus).toHaveBeenCalledWith(WORKSPACE_ID, ['MUG-1', 'GIFT-1', 'GONE-1']);
    expect(inventory.setAvailable).toHaveBeenCalledWith(
      WORKSPACE_ID,
      [{ inventoryItemId: 'item-mug', available: 12 }],
      { reason: InventoryMovementReason.IMPORTED, actor: IMPORT_ACTOR },
    );
    expect(outcome.updatedVariants).toBe(1);
    expect(outcome.productIds).toEqual(['product-mug']);
    expect(outcome.skipped).toEqual([
      expect.objectContaining({ code: ImportIssueCode.NotTracked, sku: 'GIFT-1', row: 3 }),
    ]);
    expect(outcome.failed.map((issue) => [issue.row, issue.code])).toEqual([
      [4, ImportIssueCode.InvalidValue],
      [5, ImportIssueCode.UnknownSku],
    ]);
  });

  it('reads only inventory files', () => {
    const { strategy } = setup({ levels: [], issues: [] });

    expect(strategy.supports(CatalogImportFormat.InventoryCsv)).toBe(true);
    expect(strategy.supports(CatalogImportFormat.ShopifyCsv)).toBe(false);
  });
});
