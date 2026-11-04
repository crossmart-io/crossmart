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
import { type Actor, ApiKeysService, WorkspacePermission } from '@crossmart/core';
import type { WorkspaceRole } from '@crossmart/database';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CurrentWorkspaceRole } from '../../auth/decorators/workspace-role.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { actingUserId, toActor } from '../../auth/principal.utils.js';
import { ApiKeyDto, IssuedApiKeyDto } from '../dto/api-key.dto.js';
import { CreateApiKeyDto } from '../dto/create-api-key.dto.js';
import { API_KEY_ID_PARAM, API_KEYS_ROUTE, API_KEYS_TAG } from '../workspaces.constants.js';

@ApiTags(API_KEYS_TAG)
@Controller(API_KEYS_ROUTE)
@RequirePermission(WorkspacePermission.ManageApiKeys)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Active API keys of a workspace' })
  @ApiOkResponse({ type: [ApiKeyDto] })
  async list(@Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string): Promise<ApiKeyDto[]> {
    const apiKeys = await this.apiKeys.list(workspaceId);
    return apiKeys.map((apiKey) => ApiKeyDto.from(apiKey));
  }

  @Post()
  @ApiOperation({ summary: 'Create an API key. The secret is returned once.' })
  @ApiCreatedResponse({ type: IssuedApiKeyDto })
  async create(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentPrincipal() principal: Principal,
    @CurrentWorkspaceRole() role: WorkspaceRole,
    @Body() body: CreateApiKeyDto,
  ): Promise<IssuedApiKeyDto> {
    const issuer = { userId: actingUserId(principal), role };
    const issued = await this.apiKeys.issue(workspaceId, issuer, body, toActor(principal));
    return IssuedApiKeyDto.from(issued);
  }

  @Delete(`:${API_KEY_ID_PARAM}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiNoContentResponse()
  revoke(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(API_KEY_ID_PARAM, ParseUUIDPipe) apiKeyId: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    return this.apiKeys.revoke(workspaceId, apiKeyId, actor);
  }
}
