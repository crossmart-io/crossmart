import {
  Controller,
  Get,
  Logger,
  Param,
  ParseEnumPipe,
  Query,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppConfigService } from '@crossmart/common';
import { ChannelError, ChannelType } from '@crossmart/connectors';
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
import { OAuthNonceCookie } from '../services/oauth-nonce.cookie.js';

interface RedirectTarget {
  url: string;
}

/**
 * Where channels send the merchant after they approve the app. Public, because the channel
 * makes the browser call it; the signed state proves who started the connection, and the
 * session and nonce cookie prove this is the same browser and user. The nonce cookie is
 * cleared whatever the outcome, as each state is good for one callback.
 */
@ApiExcludeController()
@Controller(OAUTH_CALLBACK_ROUTE)
export class ChannelOAuthController {
  private readonly logger = new Logger(ChannelOAuthController.name);

  constructor(
    private readonly authorizations: ChannelAuthorizationService,
    private readonly authService: AuthService,
    private readonly appConfig: AppConfigService,
    private readonly nonceCookie: OAuthNonceCookie,
  ) {}

  @Get()
  @Public()
  @Redirect()
  async callback(
    @Param(CHANNEL_PARAM, new ParseEnumPipe(ChannelType)) channel: ChannelType,
    @Query() query: Record<string, unknown>,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RedirectTarget> {
    const sessionUser = await this.authService.findUserBySession(request.headers);
    const nonce = this.nonceCookie.read(request);
    this.nonceCookie.clear(response, channel);
    try {
      await this.authorizations.complete(channel, {
        query: toQueryRecord(query),
        browser: { sessionUserId: sessionUser?.userId ?? null, nonce },
      });
      return { url: this.channelsPage({ [ChannelsPageQuery.Connected]: channel }) };
    } catch (error) {
      const { failure } = ChannelConnectError.from(error);
      this.logger.warn(`Connecting ${channel} failed (${failure}): ${this.describe(error)}`);
      return {
        url: this.channelsPage({
          [ChannelsPageQuery.Error]: failure,
          [ChannelsPageQuery.Channel]: channel,
        }),
      };
    }
  }

  /**
   * Why the connection failed, for operators. Channel errors carry a code and a message that
   * never holds tokens or response bodies; anything else is named by its type only.
   */
  private describe(error: unknown): string {
    if (error instanceof ChannelConnectError) return error.message;
    if (error instanceof ChannelError) return `${error.code}: ${error.message}`;
    return error instanceof Error ? error.name : typeof error;
  }

  private channelsPage(params: Partial<Record<ChannelsPageQuery, string>>): string {
    const url = new URL(WEB_CHANNELS_PATH, this.appConfig.webAppUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }
}
