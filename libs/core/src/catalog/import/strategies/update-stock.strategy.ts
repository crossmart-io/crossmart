import { Inject, Injectable } from '@nestjs/common';
import { InventoryMovementReason } from '@crossmart/database';
import { STOCK_FILE_PARSERS } from '../../catalog.constants.js';
import type {
  CatalogImportRequest,
  CatalogImportStrategy,
  ImportIssue,
  ImportOutcome,
  StockFileParser,
  StockLevelDraft,
} from '../../entities/catalog-import.js';
import type { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../../enums/catalog-import-mode.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import type { StockItemBySku, StockTarget } from '../../../inventory/entities/stock-levels.js';
import { StockLevelsService } from '../../../inventory/services/stock-levels.service.js';
import { findParser } from '../find-parser.js';
import { emptyOutcome } from '../import-issues.js';

interface StockPlan {
  targets: StockTarget[];
  skipped: ImportIssue[];
  failed: ImportIssue[];
}

/**
 * Sets the available stock of tracked variants, found by SKU. Unknown SKUs fail and untracked
 * variants are skipped; every other row is applied through the inventory ledger, as an import
 * by the request's actor, in a fixed number of queries.
 */
@Injectable()
export class UpdateStockStrategy implements CatalogImportStrategy {
  readonly mode = CatalogImportMode.Inventory;

  constructor(
    @Inject(STOCK_FILE_PARSERS) private readonly parsers: StockFileParser[],
    private readonly stockLevels: StockLevelsService,
  ) {}

  supports(format: CatalogImportFormat): boolean {
    return this.parsers.some((parser) => parser.format === format);
  }

  async run(workspaceId: string, request: CatalogImportRequest): Promise<ImportOutcome> {
    const { format, content } = request;
    const { levels, issues } = findParser(this.parsers, format).parse(content);
    const items = await this.stockLevels.findBySkus(
      workspaceId,
      levels.map((level) => level.sku),
    );
    const plan = this.plan(levels, new Map(items.map((item) => [item.sku, item])));
    await this.stockLevels.setAvailable(workspaceId, plan.targets, {
      reason: InventoryMovementReason.IMPORTED,
      actor: request.actor,
    });
    return {
      ...emptyOutcome(),
      updatedVariants: plan.targets.length,
      skipped: plan.skipped,
      failed: [...issues, ...plan.failed].sort(byRow),
    };
  }

  private plan(levels: StockLevelDraft[], itemBySku: Map<string, StockItemBySku>): StockPlan {
    const plan: StockPlan = { targets: [], skipped: [], failed: [] };
    for (const { sku, available, row } of levels) {
      const item = itemBySku.get(sku);
      if (!item) {
        plan.failed.push({
          code: ImportIssueCode.UnknownSku,
          message: 'No variant in the catalog has this SKU',
          sku,
          row,
        });
      } else if (!item.tracked) {
        plan.skipped.push({
          code: ImportIssueCode.NotTracked,
          message: 'This variant does not track stock; turn tracking on to set its quantity',
          sku,
          row,
        });
      } else {
        plan.targets.push({ inventoryItemId: item.inventoryItemId, available });
      }
    }
    return plan;
  }
}

function byRow(left: ImportIssue, right: ImportIssue): number {
  return (left.row ?? 0) - (right.row ?? 0);
}
