import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiAcceptedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, ChannelImportService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ImportJobDetailDto } from '../../catalog/dto/import-job.dto.js';
import {
  CHANNEL_CONNECTIONS_ROUTE,
  CHANNEL_IMPORTS_PATH,
  CHANNELS_TAG,
  CONNECTION_ID_PARAM,
} from '../channels.constants.js';

@ApiTags(CHANNELS_TAG)
@Controller(CHANNEL_CONNECTIONS_ROUTE)
export class ChannelImportsController {
  constructor(private readonly imports: ChannelImportService) {}

  @Post(CHANNEL_IMPORTS_PATH)
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermission(WorkspacePermission.EditCatalog)
  @ApiOperation({
    summary: 'Import the connected channel’s catalog',
    description:
      'Queues an import of every product of the channel account. Products already linked to ' +
      'it are refreshed, products that match the catalog by handle or SKU are linked, and the ' +
      'rest are created with their stock. Returns the import history entry; poll it with ' +
      '`GET /import-jobs/{jobId}` to follow the progress. While an import of the connection ' +
      'runs, this returns that import instead of starting another. 409 when the connection is ' +
      'not connected.',
  })
  @ApiAcceptedResponse({ type: ImportJobDetailDto })
  async start(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @CurrentActor() actor: Actor,
  ): Promise<ImportJobDetailDto> {
    return ImportJobDetailDto.from(await this.imports.start(workspaceId, connectionId, actor));
  }
}
