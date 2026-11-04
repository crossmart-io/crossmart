import { Injectable } from '@nestjs/common';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  ACCEPT_HEADER,
  CONTENT_TYPE_HEADER,
  FORM_CONTENT_TYPE,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_UNAUTHORIZED,
  JSON_CONTENT_TYPE,
} from '../../sdk/http/http.constants.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { isServerErrorStatus, isSuccessStatus } from '../../sdk/http/http-status.js';
import { HttpTransport, type HttpResponse } from '../../sdk/http/http-transport.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import { shopOrigin } from '../shop-domain.js';
import {
  SHOPIFY_ACCESS_TOKEN_PATH,
  SHOPIFY_AUTHORIZE_PATH,
  SHOPIFY_EXPIRING_TOKEN,
  SHOPIFY_REFRESH_GRANT,
  SHOPIFY_REQUESTED_SCOPES,
  SHOPIFY_SCOPE_SEPARATOR,
  ShopifyOAuthParam,
} from '../shopify.constants.js';
import { ShopifyApp } from '../shopify-app.js';
import { ShopifySignatures } from '../shopify-signatures.js';
import {
  type ShopifyGrant,
  type ShopifyTokenResponse,
  shopifyTokenResponseSchema,
  toShopifyGrant,
} from './shopify-token-response.js';

const EXCHANGE_FAILED = 'Shopify did not issue an access token';
const REFRESH_REJECTED = 'Shopify no longer accepts this connection. Connect the store again.';

export interface ShopifyAuthorizeRequest {
  shopDomain: string;
  state: string;
  redirectUri: string;
}

/**
 * Shopify's authorization code grant for an offline, expiring access token: the authorize
 * URL, the code exchange and the refresh. Tokens never appear in errors or logs.
 */
@Injectable()
export class ShopifyOAuthClient {
  constructor(
    private readonly app: ShopifyApp,
    private readonly http: HttpTransport,
    private readonly signatures: ShopifySignatures,
  ) {}

  get isConfigured(): boolean {
    return this.app.isConfigured;
  }

  /** True when the callback query is signed with the app's client secret. */
  verifyCallback(query: Readonly<Record<string, string>>): boolean {
    return this.signatures.verifyQuery(query);
  }

  authorizationUrl({ shopDomain, state, redirectUri }: ShopifyAuthorizeRequest): URL {
    const url = new URL(SHOPIFY_AUTHORIZE_PATH, shopOrigin(shopDomain));
    url.searchParams.set(ShopifyOAuthParam.ClientId, this.app.credentials().clientId);
    url.searchParams.set(
      ShopifyOAuthParam.Scope,
      SHOPIFY_REQUESTED_SCOPES.join(SHOPIFY_SCOPE_SEPARATOR),
    );
    url.searchParams.set(ShopifyOAuthParam.RedirectUri, redirectUri);
    url.searchParams.set(ShopifyOAuthParam.State, state);
    return url;
  }

  exchangeCode(shopDomain: string, code: string, now = new Date()): Promise<ShopifyGrant> {
    return this.requestToken(shopDomain, now, {
      [ShopifyOAuthParam.Code]: code,
      [ShopifyOAuthParam.Expiring]: SHOPIFY_EXPIRING_TOKEN,
    });
  }

  /** Each refresh returns a new refresh token too; the caller must store both. */
  refresh(shopDomain: string, refreshToken: string, now = new Date()): Promise<ShopifyGrant> {
    return this.requestToken(shopDomain, now, {
      [ShopifyOAuthParam.GrantType]: SHOPIFY_REFRESH_GRANT,
      [ShopifyOAuthParam.RefreshToken]: refreshToken,
    });
  }

  private async requestToken(
    shopDomain: string,
    now: Date,
    grant: Record<string, string>,
  ): Promise<ShopifyGrant> {
    const { clientId, clientSecret } = this.app.credentials();
    const body = new URLSearchParams({
      [ShopifyOAuthParam.ClientId]: clientId,
      [ShopifyOAuthParam.ClientSecret]: clientSecret,
      ...grant,
    });
    const response = await this.http.send({
      method: HttpMethod.Post,
      url: new URL(SHOPIFY_ACCESS_TOKEN_PATH, shopOrigin(shopDomain)).toString(),
      headers: { [CONTENT_TYPE_HEADER]: FORM_CONTENT_TYPE, [ACCEPT_HEADER]: JSON_CONTENT_TYPE },
      body: body.toString(),
    });
    return toShopifyGrant(this.parseTokenResponse(response, grant), now);
  }

  private parseTokenResponse(
    response: HttpResponse,
    grant: Record<string, string>,
  ): ShopifyTokenResponse {
    if (!isSuccessStatus(response.status)) {
      throw this.tokenError(response.status, ShopifyOAuthParam.RefreshToken in grant);
    }
    const parsed = shopifyTokenResponseSchema.safeParse(parseJsonBody(response.body));
    if (!parsed.success) {
      throw new ChannelError(
        ChannelType.Shopify,
        ChannelErrorCode.ChannelUnavailable,
        EXCHANGE_FAILED,
      );
    }
    return parsed.data;
  }

  private tokenError(status: number, isRefresh: boolean): ChannelError {
    if (isServerErrorStatus(status)) {
      return new ChannelError(
        ChannelType.Shopify,
        ChannelErrorCode.ChannelUnavailable,
        EXCHANGE_FAILED,
      );
    }
    const rejected = status === HTTP_STATUS_UNAUTHORIZED || status === HTTP_STATUS_BAD_REQUEST;
    return isRefresh && rejected
      ? new ChannelError(
          ChannelType.Shopify,
          ChannelErrorCode.CredentialsRejected,
          REFRESH_REJECTED,
        )
      : new ChannelError(ChannelType.Shopify, ChannelErrorCode.RequestRejected, EXCHANGE_FAILED);
  }
}
