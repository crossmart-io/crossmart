import { Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AppConfigService } from '@crossmart/common';
import type { ChannelType } from '@crossmart/connectors';
import {
  CHANNEL_OAUTH_CALLBACK_PATH,
  CHANNEL_PATH_PARAM,
  OAUTH_STATE_TTL_MS,
} from '@crossmart/core';
import { HTTPS_PROTOCOL, OAUTH_NONCE_COOKIE } from '../channels.constants.js';
import { readCookie } from '../../common/cookies.js';

const SAME_SITE_LAX = 'lax';

/**
 * Sets, reads and clears the OAuth nonce cookie. It is host-only on the API, like the session
 * cookie: the web app's credentialed request to start the connection stores it, and the
 * channel's top-level redirect back to the callback sends it (SameSite=Lax allows that, and
 * app.crossmart.io and api.crossmart.io are the same site). HttpOnly, so scripts never see it;
 * Secure whenever the API is served over HTTPS.
 */
@Injectable()
export class OAuthNonceCookie {
  constructor(private readonly appConfig: AppConfigService) {}

  set(response: Response, channel: ChannelType, nonce: string): void {
    response.cookie(OAUTH_NONCE_COOKIE, nonce, {
      ...this.options(channel),
      maxAge: OAUTH_STATE_TTL_MS,
    });
  }

  read(request: Request): string | null {
    return readCookie(request.headers.cookie, OAUTH_NONCE_COOKIE);
  }

  clear(response: Response, channel: ChannelType): void {
    response.clearCookie(OAUTH_NONCE_COOKIE, this.options(channel));
  }

  private options(channel: ChannelType): CookieOptions {
    return {
      httpOnly: true,
      secure: new URL(this.appConfig.apiPublicUrl).protocol === HTTPS_PROTOCOL,
      sameSite: SAME_SITE_LAX,
      path: CHANNEL_OAUTH_CALLBACK_PATH.replace(CHANNEL_PATH_PARAM, channel),
    };
  }
}
