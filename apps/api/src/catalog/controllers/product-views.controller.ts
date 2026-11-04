import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { type Actor, ProductViewsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CATALOG_TAG, PRODUCT_VIEWS_ROUTE, VIEW_ID_PARAM } from '../catalog.constants.js';
import { CreateProductViewDto, ProductViewDto } from '../dto/product-view.dto.js';

@ApiTags(CATALOG_TAG)
@Controller(PRODUCT_VIEWS_ROUTE)
export class ProductViewsController {
  constructor(private readonly views: ProductViewsService) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewProducts)
  @ApiOperation({ summary: 'Saved filters of the product list, oldest first' })
  @ApiOkResponse({ type: [ProductViewDto] })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<ProductViewDto[]> {
    return (await this.views.list(workspaceId)).map((view) => ProductViewDto.from(view));
  }

  @Post()
  @RequirePermission(WorkspacePermission.EditProducts)
  @ApiOperation({ summary: 'Save the current filters of the product list as a view' })
  @ApiCreatedResponse({ type: ProductViewDto })
  async create(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: CreateProductViewDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductViewDto> {
    return ProductViewDto.from(await this.views.create(workspaceId, body, actor));
  }

  @Delete(`:${VIEW_ID_PARAM}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(WorkspacePermission.EditProducts)
  @ApiOperation({ summary: 'Delete a saved view' })
  @ApiNoContentResponse()
  async delete(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(VIEW_ID_PARAM, ParseUUIDPipe) viewId: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    await this.views.delete(workspaceId, viewId, actor);
  }
}
