import { Module } from '@nestjs/common';
import { CatalogModule } from '@crossmart/core';
import { ProductImportsController } from './controllers/product-imports.controller.js';
import { ProductsController } from './controllers/products.controller.js';

@Module({
  imports: [CatalogModule],
  controllers: [ProductsController, ProductImportsController],
})
export class CatalogApiModule {}
