import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CATALOG_STATS_ROUTE, CATALOG_TAG } from '../catalog.constants.js';
import { CatalogStatsDto } from '../dto/catalog-stats.dto.js';

@ApiTags(CATALOG_TAG)
@Controller(CATALOG_STATS_ROUTE)
export class CatalogStatsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({ summary: 'Product and stock counts for the workspace overview' })
  @ApiOkResponse({ type: CatalogStatsDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<CatalogStatsDto> {
    return CatalogStatsDto.from(await this.products.stats(workspaceId));
  }
}
