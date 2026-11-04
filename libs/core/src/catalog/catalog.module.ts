import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import {
  CATALOG_FILE_PARSERS,
  CATALOG_IMPORT_STRATEGIES,
  STOCK_FILE_PARSERS,
} from './catalog.constants.js';
import type {
  CatalogFileParser,
  CatalogImportStrategy,
  StockFileParser,
} from './entities/catalog-import.js';
import { InventoryCsvParser } from './import/inventory-csv/inventory-csv.parser.js';
import { ShopifyCsvParser } from './import/shopify-csv/shopify-csv.parser.js';
import { CreateProductsStrategy } from './import/strategies/create-products.strategy.js';
import { UpdateProductsStrategy } from './import/strategies/update-products.strategy.js';
import { UpdateStockStrategy } from './import/strategies/update-stock.strategy.js';
import { ImportJobRepository } from './repositories/import-job.repository.js';
import { ProductBulkWriter } from './repositories/product-bulk.writer.js';
import { ProductUpdateWriter } from './repositories/product-update.writer.js';
import { ProductViewRepository } from './repositories/product-view.repository.js';
import { ProductRepository } from './repositories/product.repository.js';
import { BulkProductActionsService } from './services/bulk-product-actions.service.js';
import { CatalogConflictsService } from './services/catalog-conflicts.service.js';
import { CatalogImportService } from './services/catalog-import.service.js';
import { ImportJobsService } from './services/import-jobs.service.js';
import { ProductViewsService } from './services/product-views.service.js';
import { ProductsService } from './services/products.service.js';

/**
 * Products, variants, media and catalog imports. Add a file format by registering its parser,
 * and an import mode by registering its strategy.
 */
@Module({
  imports: [ActivityModule, InventoryModule],
  providers: [
    ProductRepository,
    ProductUpdateWriter,
    ProductBulkWriter,
    ProductViewRepository,
    CatalogConflictsService,
    BulkProductActionsService,
    ProductViewsService,
    ProductsService,
    ImportJobRepository,
    ImportJobsService,
    CatalogImportService,
    ShopifyCsvParser,
    InventoryCsvParser,
    CreateProductsStrategy,
    UpdateProductsStrategy,
    UpdateStockStrategy,
    {
      provide: CATALOG_FILE_PARSERS,
      useFactory: (shopifyCsv: ShopifyCsvParser): CatalogFileParser[] => [shopifyCsv],
      inject: [ShopifyCsvParser],
    },
    {
      provide: STOCK_FILE_PARSERS,
      useFactory: (inventoryCsv: InventoryCsvParser): StockFileParser[] => [inventoryCsv],
      inject: [InventoryCsvParser],
    },
    {
      provide: CATALOG_IMPORT_STRATEGIES,
      useFactory: (
        create: CreateProductsStrategy,
        update: UpdateProductsStrategy,
        stock: UpdateStockStrategy,
      ): CatalogImportStrategy[] => [create, update, stock],
      inject: [CreateProductsStrategy, UpdateProductsStrategy, UpdateStockStrategy],
    },
  ],
  exports: [
    ProductRepository,
    CatalogConflictsService,
    ProductsService,
    CatalogImportService,
    ImportJobsService,
    BulkProductActionsService,
    ProductViewsService,
  ],
})
export class CatalogModule {}
