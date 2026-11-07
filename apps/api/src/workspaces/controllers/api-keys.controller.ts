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
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeysService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import {
  type ActingManager,
  CurrentManager,
} from '../../auth/decorators/current-manager.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ApiKeyDto, IssuedApiKeyDto } from '../dto/api-key.dto.js';
import { CreateApiKeyDto } from '../dto/create-api-key.dto.js';
import { API_KEY_ID_PARAM, API_KEYS_ROUTE, API_KEYS_TAG } from '../workspaces.constants.js';
import { ApiPlanLimitResponse } from '../../entitlements/decorators/api-plan-limit-response.decorator.js';
import { AllowedWhileReadOnly } from '../../billing/decorators/allowed-while-read-only.decorator.js';

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
  @ApiPlanLimitResponse()
  async create(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: CreateApiKeyDto,
    @CurrentManager() { manager, actor }: ActingManager,
  ): Promise<IssuedApiKeyDto> {
    return IssuedApiKeyDto.from(await this.apiKeys.issue(workspaceId, manager, body, actor));
  }

  @Delete(`:${API_KEY_ID_PARAM}`)
  @AllowedWhileReadOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke an API key',
    description:
      'Answers 403 unless the caller created the key or has every permission the key has.',
  })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ description: 'The key has more access than the caller' })
  revoke(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(API_KEY_ID_PARAM, ParseUUIDPipe) apiKeyId: string,
    @CurrentManager() { manager, actor }: ActingManager,
  ): Promise<void> {
    return this.apiKeys.revoke(workspaceId, apiKeyId, manager, actor);
  }
}
