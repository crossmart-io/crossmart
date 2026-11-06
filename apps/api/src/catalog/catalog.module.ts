import { Module } from '@nestjs/common';
import { CatalogModule, ListingsModule, MediaModule } from '@crossmart/core';
import { ImportJobsController } from './controllers/import-jobs.controller.js';
import { CatalogStatsController } from './controllers/catalog-stats.controller.js';
import { ProductBulkActionsController } from './controllers/product-bulk-actions.controller.js';
import { ProductImagesController } from './controllers/product-images.controller.js';
import { ProductImportsController } from './controllers/product-imports.controller.js';
import { ProductViewsController } from './controllers/product-views.controller.js';
import { ProductsController } from './controllers/products.controller.js';

@Module({
  imports: [CatalogModule, ListingsModule, MediaModule],
  controllers: [
    ProductsController,
    ProductBulkActionsController,
    ProductViewsController,
    ProductImportsController,
    ImportJobsController,
    ProductImagesController,
    CatalogStatsController,
  ],
})
export class CatalogApiModule {}
