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
import { AppConfigService, describeError } from '@crossmart/common';
import { ChannelType } from '@crossmart/connectors';
import {
  ChannelAuthorizationService,
  ChannelConnectError,
  type CompletedAuthorization,
} from '@crossmart/core';
import { Public } from '../../auth/decorators/public.decorator.js';
import { AuthService } from '../../auth/services/auth.service.js';
import {
  CHANNEL_PARAM,
  OAUTH_CALLBACK_ROUTE,
  STORES_PAGE_FLAG,
  StoresPageQuery,
  WEB_STORES_PATH,
} from '../channels.constants.js';
import { toQueryRecord } from '../query-record.js';
import { OAuthNonceCookie } from '../services/oauth-nonce.cookie.js';

interface RedirectTarget {
  url: string;
}

type StoresPageParams = Partial<Record<StoresPageQuery, string>>;

/**
 * Where channels send the merchant after they approve the app. Public, because the channel
 * makes the browser call it; the signed state proves who started the connection, and the
 * session and nonce cookie prove this is the same browser and user. The nonce cookie is
 * cleared whatever the outcome, as each state is good for one callback. The merchant lands on
 * the web app's Stores page, told which connection was made or why it failed.
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
      const completed = await this.authorizations.complete(channel, {
        query: toQueryRecord(query),
        browser: { sessionUserId: sessionUser?.userId ?? null, nonce },
      });
      return { url: this.storesPage(connectedParams(channel, completed)) };
    } catch (error) {
      const { failure } = ChannelConnectError.from(error);
      this.logger.warn(`Connecting ${channel} failed (${failure}): ${this.describe(error)}`);
      return {
        url: this.storesPage({
          [StoresPageQuery.Error]: failure,
          [StoresPageQuery.Channel]: channel,
        }),
      };
    }
  }

  /**
   * Why the connection failed, for operators. Connect errors carry a message written for them;
   * anything else is described without tokens or response bodies (`describeError`).
   */
  private describe(error: unknown): string {
    return error instanceof ChannelConnectError ? error.message : describeError(error);
  }

  private storesPage(params: StoresPageParams): string {
    const url = new URL(WEB_STORES_PATH, this.appConfig.webAppUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }
}

/**
 * What a successful callback tells the web app: the channel (read by older web builds), the
 * connection, and, for an account connected before, that it was a re-auth.
 */
function connectedParams(
  channel: ChannelType,
  completed: CompletedAuthorization,
): StoresPageParams {
  return {
    [StoresPageQuery.Connected]: channel,
    [StoresPageQuery.ConnectionId]: completed.connection.id,
    ...(completed.reconnected ? { [StoresPageQuery.Reconnected]: STORES_PAGE_FLAG } : {}),
  };
}
