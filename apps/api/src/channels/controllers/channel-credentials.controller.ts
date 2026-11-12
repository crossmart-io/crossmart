import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { SellerCredentialsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { ApiPlanLimitResponse } from '../../entitlements/decorators/api-plan-limit-response.decorator.js';
import { ApiSandboxRestrictedResponse } from '../../entitlements/decorators/api-sandbox-restricted-response.decorator.js';
import {
  CHANNEL_CONNECTIONS_ROUTE,
  CHANNELS_TAG,
  CHANNEL_UNAVAILABLE_RESPONSE_DESCRIPTION,
  CREDENTIALS_PATH,
  CREDENTIALS_REJECTED_RESPONSE_DESCRIPTION,
} from '../channels.constants.js';
import {
  ConnectedChannelDto,
  ConnectWithCredentialsDto,
} from '../dto/connect-with-credentials.dto.js';
import { CredentialsRejectedErrorDto } from '../dto/credentials-rejected-error.dto.js';
import { FalabellaCredentialsDto } from '../dto/falabella-credentials.dto.js';

/** Connects channels whose sellers paste the keys the channel issued them (Falabella). */
@ApiTags(CHANNELS_TAG)
@ApiExtraModels(FalabellaCredentialsDto)
@Controller(CHANNEL_CONNECTIONS_ROUTE)
export class ChannelCredentialsController {
  constructor(private readonly sellerCredentials: SellerCredentialsService) {}

  @Post(CREDENTIALS_PATH)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Connect a channel account with credentials the channel issued',
    description:
      'For channels whose sellers paste keys instead of approving an app (Falabella). The ' +
      'credentials are checked with a live call to the channel, then stored encrypted; they are ' +
      'never returned or logged. Connecting the same account again replaces its keys. Needs a ' +
      'signed-in user.',
  })
  @ApiCreatedResponse({ type: ConnectedChannelDto })
  @ApiUnprocessableEntityResponse({
    type: CredentialsRejectedErrorDto,
    description: CREDENTIALS_REJECTED_RESPONSE_DESCRIPTION,
  })
  @ApiServiceUnavailableResponse({ description: CHANNEL_UNAVAILABLE_RESPONSE_DESCRIPTION })
  @ApiPlanLimitResponse()
  @ApiSandboxRestrictedResponse()
  async connect(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentPrincipal() principal: Principal,
    @Body() body: ConnectWithCredentialsDto,
  ): Promise<ConnectedChannelDto> {
    const { userId } = requireUser(principal);
    return ConnectedChannelDto.from(
      await this.sellerCredentials.connect(workspaceId, userId, body),
    );
  }
}
