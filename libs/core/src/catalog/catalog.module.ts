import { Module } from '@nestjs/common';
import { CATALOG_FILE_PARSERS } from './catalog.constants.js';
import type { CatalogFileParser } from './entities/catalog-import.js';
import { ShopifyCsvParser } from './import/shopify-csv/shopify-csv.parser.js';
import { ProductUpdateWriter } from './repositories/product-update.writer.js';
import { ProductRepository } from './repositories/product.repository.js';
import { CatalogConflictsService } from './services/catalog-conflicts.service.js';
import { CatalogImportService } from './services/catalog-import.service.js';
import { ProductsService } from './services/products.service.js';

/** Products, variants, media and catalog imports. Add a file format by registering its parser. */
@Module({
  providers: [
    ProductRepository,
    ProductUpdateWriter,
    CatalogConflictsService,
    ProductsService,
    CatalogImportService,
    ShopifyCsvParser,
    {
      provide: CATALOG_FILE_PARSERS,
      useFactory: (shopifyCsv: ShopifyCsvParser): CatalogFileParser[] => [shopifyCsv],
      inject: [ShopifyCsvParser],
    },
  ],
  exports: [ProductsService, CatalogImportService],
})
export class CatalogModule {}
