import { Module } from '@nestjs/common';
import { CatalogModule, MediaModule } from '@crossmart/core';
import { CatalogStatsController } from './controllers/catalog-stats.controller.js';
import { ProductImagesController } from './controllers/product-images.controller.js';
import { ProductImportsController } from './controllers/product-imports.controller.js';
import { ProductsController } from './controllers/products.controller.js';

@Module({
  imports: [CatalogModule, MediaModule],
  controllers: [
    ProductsController,
    ProductImportsController,
    ProductImagesController,
    CatalogStatsController,
  ],
})
export class CatalogApiModule {}
