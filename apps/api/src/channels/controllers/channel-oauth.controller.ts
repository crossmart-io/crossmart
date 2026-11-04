import { Controller, Get, Param, ParseEnumPipe, Query, Redirect, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { AppConfigService } from '@crossmart/common';
import { ChannelType } from '@crossmart/connectors';
import { ChannelAuthorizationService, ChannelConnectError } from '@crossmart/core';
import { Public } from '../../auth/decorators/public.decorator.js';
import { AuthService } from '../../auth/services/auth.service.js';
import {
  CHANNEL_PARAM,
  ChannelsPageQuery,
  OAUTH_CALLBACK_ROUTE,
  WEB_CHANNELS_PATH,
} from '../channels.constants.js';
import { toQueryRecord } from '../query-record.js';

interface RedirectTarget {
  url: string;
}

/**
 * Where channels send the merchant after they approve the app. Public, because the channel
 * makes the browser call it; the signed state proves who started the connection.
 */
@ApiExcludeController()
@Controller(OAUTH_CALLBACK_ROUTE)
export class ChannelOAuthController {
  constructor(
    private readonly authorizations: ChannelAuthorizationService,
    private readonly authService: AuthService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Get()
  @Public()
  @Redirect()
  async callback(
    @Param(CHANNEL_PARAM, new ParseEnumPipe(ChannelType)) channel: ChannelType,
    @Query() query: Record<string, unknown>,
    @Req() request: Request,
  ): Promise<RedirectTarget> {
    const sessionUser = await this.authService.findUserBySession(request.headers);
    try {
      await this.authorizations.complete(channel, {
        query: toQueryRecord(query),
        sessionUserId: sessionUser?.userId ?? null,
      });
      return { url: this.channelsPage({ [ChannelsPageQuery.Connected]: channel }) };
    } catch (error) {
      const { failure } = ChannelConnectError.from(error);
      return {
        url: this.channelsPage({
          [ChannelsPageQuery.Error]: failure,
          [ChannelsPageQuery.Channel]: channel,
        }),
      };
    }
  }

  private channelsPage(params: Partial<Record<ChannelsPageQuery, string>>): string {
    const url = new URL(WEB_CHANNELS_PATH, this.appConfig.webAppUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }
}
