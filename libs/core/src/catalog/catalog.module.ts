import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { CATALOG_FILE_PARSERS } from './catalog.constants.js';
import type { CatalogFileParser } from './entities/catalog-import.js';
import { ShopifyCsvParser } from './import/shopify-csv/shopify-csv.parser.js';
import { ProductBulkWriter } from './repositories/product-bulk.writer.js';
import { ProductUpdateWriter } from './repositories/product-update.writer.js';
import { ProductViewRepository } from './repositories/product-view.repository.js';
import { ProductRepository } from './repositories/product.repository.js';
import { BulkProductActionsService } from './services/bulk-product-actions.service.js';
import { CatalogConflictsService } from './services/catalog-conflicts.service.js';
import { CatalogImportService } from './services/catalog-import.service.js';
import { ProductViewsService } from './services/product-views.service.js';
import { ProductsService } from './services/products.service.js';

/** Products, variants, media and catalog imports. Add a file format by registering its parser. */
@Module({
  imports: [ActivityModule],
  providers: [
    ProductRepository,
    ProductUpdateWriter,
    ProductBulkWriter,
    ProductViewRepository,
    CatalogConflictsService,
    BulkProductActionsService,
    ProductViewsService,
    ProductsService,
    CatalogImportService,
    ShopifyCsvParser,
    {
      provide: CATALOG_FILE_PARSERS,
      useFactory: (shopifyCsv: ShopifyCsvParser): CatalogFileParser[] => [shopifyCsv],
      inject: [ShopifyCsvParser],
    },
  ],
  exports: [ProductsService, CatalogImportService, BulkProductActionsService, ProductViewsService],
})
export class CatalogModule {}
