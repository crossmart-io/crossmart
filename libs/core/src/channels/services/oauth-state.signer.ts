import { hkdfSync } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  AppConfigService,
  constantTimeEquals,
  generateSecureToken,
  hmacSha256,
} from '@crossmart/common';
import {
  OAUTH_STATE_KEY_BYTES,
  OAUTH_STATE_KEY_INFO,
  OAUTH_STATE_NONCE_BYTES,
  OAUTH_STATE_SEPARATOR,
  OAUTH_STATE_TTL_MS,
} from '../channels.constants.js';
import {
  type OAuthStateClaims,
  type OAuthStatePayload,
  oauthStatePayloadSchema,
} from '../entities/oauth-state.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import { ChannelConnectError } from '../errors/channel-connect.error.js';

const HASH = 'sha256';
const ENCODING = 'base64url';
const STATE_PART_COUNT = 2;

/**
 * Signs the OAuth `state`: who started the connection, for which workspace and account, with a
 * random nonce and an expiry. The key is derived from the auth secret, so no extra setting is
 * needed, and the state cannot be forged or used after it expires. `OAuthStateService` binds it
 * to the browser and makes it single use.
 */
@Injectable()
export class OAuthStateSigner {
  private readonly key: Buffer;

  constructor(appConfig: AppConfigService) {
    this.key = Buffer.from(
      hkdfSync(
        HASH,
        appConfig.authSecret,
        Buffer.alloc(0),
        OAUTH_STATE_KEY_INFO,
        OAUTH_STATE_KEY_BYTES,
      ),
    );
  }

  /**
   * The signed state. `nonce` binds it to the browser that started the connection: the same
   * value goes into a cookie, and the callback requires both to match.
   */
  sign(
    claims: OAuthStateClaims,
    now = new Date(),
    nonce = generateSecureToken(OAUTH_STATE_NONCE_BYTES),
  ): string {
    const payload: OAuthStatePayload = {
      ...claims,
      nonce,
      expiresAt: now.getTime() + OAUTH_STATE_TTL_MS,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString(ENCODING);
    return `${encoded}${OAUTH_STATE_SEPARATOR}${this.signature(encoded)}`;
  }

  /** The claims of a valid state; throws `ChannelConnectError` when forged or expired. */
  verify(state: string | undefined, now = new Date()): OAuthStatePayload {
    const parts = state?.split(OAUTH_STATE_SEPARATOR) ?? [];
    const [encoded, signature] = parts;
    if (
      parts.length !== STATE_PART_COUNT ||
      !constantTimeEquals(signature, this.signature(encoded))
    ) {
      throw new ChannelConnectError(ConnectFailure.InvalidState);
    }
    const payload = this.decode(encoded);
    if (payload.expiresAt <= now.getTime()) {
      throw new ChannelConnectError(ConnectFailure.ExpiredState);
    }
    return payload;
  }

  private signature(encoded: string): string {
    return hmacSha256(this.key, encoded, ENCODING);
  }

  private decode(encoded: string): OAuthStatePayload {
    try {
      return oauthStatePayloadSchema.parse(JSON.parse(Buffer.from(encoded, ENCODING).toString()));
    } catch {
      throw new ChannelConnectError(ConnectFailure.InvalidState);
    }
  }
}
