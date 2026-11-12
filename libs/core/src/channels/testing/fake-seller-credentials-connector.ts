import {
  ChannelAuthStrategy,
  type ChannelCapability,
  type ChannelSettings,
  ChannelType,
  RateLimitScope,
  type SellerCredentialsConnector,
  type SellerCredentialValues,
  type VerifiedSellerAccount,
} from '@crossmart/connectors';

export const FAKE_SELLER_ACCOUNT = 'SC478FA:facl';
export const FAKE_API_KEY = 'fake-api-key-123';

/** A connector merchants paste keys into, whose verification each test sets. */
export class FakeSellerCredentialsConnector implements SellerCredentialsConnector {
  readonly channel = ChannelType.Falabella;
  readonly displayName = 'Falabella';
  readonly authStrategy = ChannelAuthStrategy.SellerCredentials;
  readonly capabilities: ReadonlySet<ChannelCapability> = new Set();
  readonly rateLimits = [
    { name: 'fake', scope: RateLimitScope.Connection, capacity: 1, restorePerSecond: 1 },
  ];
  readonly requiredScopes: readonly string[] = [];
  readonly credentialFields = [
    { key: 'userId', secret: false, maxLength: 64 },
    { key: 'apiKey', secret: true, maxLength: 64 },
  ];

  verifyCredentials = vi.fn<(values: SellerCredentialValues) => Promise<VerifiedSellerAccount>>(
    (values) =>
      Promise.resolve({
        externalAccountId: FAKE_SELLER_ACCOUNT,
        credentials: { accessToken: values.apiKey },
        grantedScopes: [],
        profile: { displayName: 'SC478FA (Chile)', settings: { channel: ChannelType.Falabella } },
      }),
  );

  isConfigured(): boolean {
    return true;
  }

  describeAccount(): Promise<VerifiedSellerAccount['profile']> {
    return Promise.resolve({ displayName: 'SC478FA (Chile)', settings: { channel: this.channel } });
  }

  parseSettings(): ChannelSettings {
    return { channel: ChannelType.Falabella };
  }
}
