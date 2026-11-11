import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  type Actor,
  ProductSaleService,
  ProductStoreDisplays,
  ProductsService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  CATALOG_TAG,
  MARK_SOLD_PATH,
  PRODUCT_ID_PARAM,
  PRODUCTS_ROUTE,
  VARIANT_PATH,
} from '../catalog.constants.js';
import { CreateProductDto } from '../dto/create-product.dto.js';
import { ListProductsQueryDto } from '../dto/list-products-query.dto.js';
import { ProductPageDto } from '../dto/product-summary.dto.js';
import { ProductDto } from '../dto/product.dto.js';
import { ProductSaleDto } from '../dto/product-sale.dto.js';
import { UpdateProductContentDto } from '../dto/update-product-content.dto.js';
import { UpdateVariantPriceDto, VariantParamsDto } from '../dto/variant-price.dto.js';
import { UpdateProductDto } from '../dto/update-product.dto.js';
import { ApiSandboxRestrictedResponse } from '../../entitlements/decorators/api-sandbox-restricted-response.decorator.js';

@ApiTags(CATALOG_TAG)
@Controller(PRODUCTS_ROUTE)
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly storeDisplays: ProductStoreDisplays,
    private readonly sales: ProductSaleService,
  ) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewProducts)
  @ApiOperation({
    summary: 'Products of a workspace, in title order',
    description:
      'Each row’s `stores` badges carry `displayState`, `displayReason` and ' +
      '`displayRequirement`, computed by the same rule as the store’s own pages.',
  })
  @ApiOkResponse({ type: ProductPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: ListProductsQueryDto,
  ): Promise<ProductPageDto> {
    const page = await this.products.list(workspaceId, query);
    const items = await this.storeDisplays.display(workspaceId, page.items);
    return ProductPageDto.from({ ...page, items });
  }

  @Get(`:${PRODUCT_ID_PARAM}`)
  @RequirePermission(WorkspacePermission.ViewProducts)
  @ApiOperation({ summary: 'A product with its variants, stock and media' })
  @ApiOkResponse({ type: ProductDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(PRODUCT_ID_PARAM, ParseUUIDPipe) productId: string,
  ): Promise<ProductDto> {
    return ProductDto.from(await this.products.get(workspaceId, productId));
  }

  @Post()
  @RequirePermission(WorkspacePermission.EditProducts)
  @ApiOperation({ summary: 'Create a product with its variants' })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiSandboxRestrictedResponse()
  async create(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: CreateProductDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductDto> {
    return ProductDto.from(await this.products.create(workspaceId, body.toDraft(), actor));
  }

  @Put(`:${PRODUCT_ID_PARAM}`)
  @RequirePermission(WorkspacePermission.EditProducts)
  @ApiOperation({
    summary: 'Replace a product',
    description:
      'Variants sent with an id are edited, new ones are added and missing ones are removed. ' +
      'Stock changes are written to the inventory ledger as adjustments.',
  })
  @ApiOkResponse({ type: ProductDto })
  async update(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(PRODUCT_ID_PARAM, ParseUUIDPipe) productId: string,
    @Body() body: UpdateProductDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductDto> {
    const draft = body.toDraft();
    return ProductDto.from(await this.products.update(workspaceId, productId, draft, actor));
  }

  @Patch(`:${PRODUCT_ID_PARAM}`)
  @RequirePermission(WorkspacePermission.EditProducts)
  @ApiOperation({
    summary: 'Edit a product’s title or description',
    description:
      'Changes only the fields sent; variants, prices, stock and images stay as they are. ' +
      'Connected stores are updated like after any content edit.',
  })
  @ApiOkResponse({ type: ProductDto })
  async updateContent(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(PRODUCT_ID_PARAM, ParseUUIDPipe) productId: string,
    @Body() body: UpdateProductContentDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductDto> {
    return ProductDto.from(await this.products.updateContent(workspaceId, productId, body, actor));
  }

  @Patch(VARIANT_PATH)
  @RequirePermission(WorkspacePermission.EditProducts)
  @ApiOperation({
    summary: 'Change one variant’s price or compare-at price',
    description:
      'Changes only the prices sent; the rest of the product stays as it is. Connected stores ' +
      'are updated like after any price edit. A null compare-at price removes it.',
  })
  @ApiOkResponse({ type: ProductDto })
  async updateVariantPrice(
    @Param() params: VariantParamsDto,
    @Body() body: UpdateVariantPriceDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductDto> {
    return ProductDto.from(await this.products.updateVariantPrice(params, body, actor));
  }

  @Post(MARK_SOLD_PATH)
  @RequirePermission(WorkspacePermission.EditProducts)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a product sold',
    description:
      'For an item that sold outside the connected stores, such as a one-of-a-kind item sold in ' +
      'person. Sets the available stock of every tracked variant to 0 (logged as sold) and takes ' +
      'the product off every connected store, as removing it by hand does, so it cannot sell ' +
      'twice. Idempotent: calling it again changes nothing and answers `alreadySold: true`.',
  })
  @ApiOkResponse({ type: ProductSaleDto })
  async markSold(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(PRODUCT_ID_PARAM, ParseUUIDPipe) productId: string,
    @CurrentActor() actor: Actor,
  ): Promise<ProductSaleDto> {
    return ProductSaleDto.from(await this.sales.markSold(workspaceId, productId, actor));
  }

  @Delete(`:${PRODUCT_ID_PARAM}`)
  @RequirePermission(WorkspacePermission.EditProducts)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product, its variants and their stock' })
  @ApiNoContentResponse()
  delete(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(PRODUCT_ID_PARAM, ParseUUIDPipe) productId: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    return this.products.delete(workspaceId, productId, actor);
  }
}
