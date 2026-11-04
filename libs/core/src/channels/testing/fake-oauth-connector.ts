import {
  ChannelAuthStrategy,
  type ChannelAccountProfile,
  ChannelCapability,
  type ChannelAuthorization,
  type ChannelCredentials,
  type ChannelSession,
  type ChannelSettings,
  ChannelType,
  type ChannelWebhookEvent,
  type IncomingWebhook,
  type OAuthAppConnector,
  type OAuthAuthorizeRequest,
  RateLimitScope,
  type WebhookReceiver,
  type OptionalScope,
} from '@crossmart/connectors';

export const FAKE_ACCOUNT = 'demo-store.myshopify.com';

/** An OAuth connector whose behaviour each test sets, for core service tests. */
export class FakeOAuthConnector implements OAuthAppConnector, WebhookReceiver {
  readonly channel = ChannelType.Shopify;
  readonly displayName = 'Shopify';
  readonly authStrategy = ChannelAuthStrategy.OAuthApp;
  capabilities: ReadonlySet<ChannelCapability> = new Set([ChannelCapability.ReceiveWebhooks]);
  readonly rateLimits = [
    { name: 'fake', scope: RateLimitScope.Connection, capacity: 1, restorePerSecond: 1 },
  ];
  readonly requiredScopes = ['read_products'];
  optionalScopes?: readonly OptionalScope[];

  configured = true;
  authorization: ChannelAuthorization = {
    externalAccountId: FAKE_ACCOUNT,
    credentials: {
      accessToken: 'token-1',
      refreshToken: 'refresh-1',
      accessTokenExpiresAt: '2026-11-03T11:00:00.000Z',
    },
    grantedScopes: ['read_products'],
  };
  completeAuthorization = vi.fn<(callback: unknown) => Promise<ChannelAuthorization>>(() =>
    Promise.resolve(this.authorization),
  );
  refreshCredentials = vi.fn<
    (account: string, credentials: ChannelCredentials) => Promise<ChannelCredentials>
  >(() =>
    Promise.resolve({
      accessToken: 'token-2',
      refreshToken: 'refresh-2',
      accessTokenExpiresAt: '2026-11-03T12:00:00.000Z',
    }),
  );
  revokeAccess = vi.fn<(session: ChannelSession) => Promise<void>>(() => Promise.resolve());
  webhookEvent: ChannelWebhookEvent | null = null;

  isConfigured(): boolean {
    return this.configured;
  }

  normalizeAccountHandle(accountHandle: string): string | null {
    return accountHandle.includes(' ') ? null : FAKE_ACCOUNT;
  }

  authorizationUrl(request: OAuthAuthorizeRequest): URL {
    const url = new URL(`https://${request.accountHandle}/authorize`);
    url.searchParams.set('state', request.state);
    url.searchParams.set('redirect_uri', request.redirectUri);
    return url;
  }

  describeAccount(): Promise<ChannelAccountProfile> {
    return Promise.resolve({
      displayName: 'Demo Store',
      settings: { channel: ChannelType.Shopify },
    });
  }

  parseSettings(raw: unknown): ChannelSettings {
    if (
      typeof raw !== 'object' ||
      raw === null ||
      Reflect.get(raw, 'channel') !== ChannelType.Shopify
    ) {
      throw new Error('Invalid settings');
    }
    return { channel: ChannelType.Shopify };
  }

  verifyWebhook(_webhook: IncomingWebhook): ChannelWebhookEvent | null {
    return this.webhookEvent;
  }
}
