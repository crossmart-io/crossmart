import { randomBytes } from 'node:crypto';
import { BadRequestException, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { AesGcmEnvelopeEncryption, InMemoryDataKeyStore, MasterKeyRing } from '@crossmart/common';
import {
  ChannelConnectorRegistry,
  ChannelError,
  ChannelErrorCode,
  ChannelType,
} from '@crossmart/connectors';
import { ActivityOutcome } from '@crossmart/database';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { SandboxRestriction } from '../../entitlements/enums/sandbox-restriction.enum.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import {
  noSandboxEntitlements,
  sandboxRestricted,
} from '../../entitlements/testing/sandbox-entitlements.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import type { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { connectionRecord, USER_ID, WORKSPACE_ID } from '../testing/channel-connection.fixtures.js';
import { FakeOAuthConnector } from '../testing/fake-oauth-connector.js';
import {
  FAKE_API_KEY,
  FAKE_SELLER_ACCOUNT,
  FakeSellerCredentialsConnector,
} from '../testing/fake-seller-credentials-connector.js';
import { ChannelConnectionQuota } from './channel-connection.quota.js';
import { ConnectedAccountWriter } from './connected-account.writer.js';
import { ConnectionCredentialsVault } from './connection-credentials.vault.js';
import { SellerCredentialsService } from './seller-credentials.service.js';
import { SellerCredentialsConnectorResolver } from './seller-credentials-connector.resolver.js';

const REQUEST = {
  channel: ChannelType.Falabella,
  credentials: { userId: ' seller@example.com ', apiKey: FAKE_API_KEY },
};

function setup() {
  const connector = new FakeSellerCredentialsConnector();
  const ring = MasterKeyRing.fromSettings({
    currentKey: randomBytes(32).toString('base64'),
    currentVersion: 1,
  });
  const vault = new ConnectionCredentialsVault(
    new AesGcmEnvelopeEncryption(ring, new InMemoryDataKeyStore()),
  );
  const connections = {
    upsertConnected: vi.fn<ChannelConnectionRepository['upsertConnected']>((record) =>
      Promise.resolve({
        record: connectionRecord({
          channel: ChannelType.Falabella,
          externalAccountId: record.externalAccountId,
          displayName: record.displayName,
          settings: { account: { channel: ChannelType.Falabella }, productSelection: null },
        }),
        reconnected: true,
      }),
    ),
    holdsSlot: vi.fn<ChannelConnectionRepository['holdsSlot']>().mockResolvedValue(false),
  };
  const entitlements = {
    ...noSandboxEntitlements(),
    enforced: true,
    assertInWorkspace: vi.fn<EntitlementService['assertInWorkspace']>().mockResolvedValue(),
  };
  const repository = connections as unknown as ChannelConnectionRepository;
  const quota = new ChannelConnectionQuota(
    repository,
    entitlements as unknown as EntitlementService,
  );
  const activity = new InMemoryActivityRecorder();
  const service = new SellerCredentialsService(
    new SellerCredentialsConnectorResolver(
      new ChannelConnectorRegistry([connector, new FakeOAuthConnector()]),
      vault,
    ),
    quota,
    new ConnectedAccountWriter(vault, repository, quota),
    activity,
  );
  return { service, connector, connections, entitlements, activity, vault };
}

describe('SellerCredentialsService', () => {
  it('verifies the trimmed values, seals the key and records the connection', async () => {
    const { service, connector, connections, activity, vault } = setup();

    const completed = await service.connect(WORKSPACE_ID, USER_ID, REQUEST);

    expect(connector.verifyCredentials).toHaveBeenCalledWith({
      userId: 'seller@example.com',
      apiKey: FAKE_API_KEY,
    });
    const stored = connections.upsertConnected.mock.calls[0]?.[0];
    expect(stored).toMatchObject({
      workspaceId: WORKSPACE_ID,
      channel: ChannelType.Falabella,
      externalAccountId: FAKE_SELLER_ACCOUNT,
      displayName: 'SC478FA (Chile)',
      connectedById: USER_ID,
      settings: expect.objectContaining({ account: { channel: ChannelType.Falabella } }),
    });
    expect(stored?.sealedCredentials).not.toContain(FAKE_API_KEY);
    const owner = {
      workspaceId: WORKSPACE_ID,
      channel: ChannelType.Falabella,
      externalAccountId: FAKE_SELLER_ACCOUNT,
    };
    await expect(vault.open(owner, stored?.sealedCredentials ?? '')).resolves.toEqual({
      accessToken: FAKE_API_KEY,
    });
    expect(completed.reconnected).toBe(true);
    expect(activity.entries).toEqual([
      expect.objectContaining({ action: ActivityAction.ChannelConnected, detail: 'Falabella' }),
    ]);
    expect(JSON.stringify(activity.entries)).not.toContain(FAKE_API_KEY);
  });

  it('refuses incomplete values with 400 before calling the channel', async () => {
    const { service, connector } = setup();

    await expect(
      service.connect(WORKSPACE_ID, USER_ID, { ...REQUEST, credentials: { userId: 'me' } }),
    ).rejects.toThrow(BadRequestException);
    expect(connector.verifyCredentials).not.toHaveBeenCalled();
  });

  it('refuses channels connected through OAuth', async () => {
    const { service } = setup();

    await expect(
      service.connect(WORKSPACE_ID, USER_ID, { ...REQUEST, channel: ChannelType.Shopify }),
    ).rejects.toThrow(BadRequestException);
  });

  it('answers 422 with the channel’s reason when it rejects the keys, and logs the failure', async () => {
    const { service, connector, connections, activity } = setup();
    connector.verifyCredentials.mockRejectedValueOnce(
      new ChannelError(
        ChannelType.Falabella,
        ChannelErrorCode.CredentialsRejected,
        'E007: Login failed',
      ),
    );

    const error = await service
      .connect(WORKSPACE_ID, USER_ID, REQUEST)
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      response: { failure: ConnectFailure.CredentialsRejected, message: 'E007: Login failed' },
    });
    expect(connections.upsertConnected).not.toHaveBeenCalled();
    expect(activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.ChannelConnectFailed,
        outcome: ActivityOutcome.FAILED,
      }),
    ]);
    expect(JSON.stringify(activity.entries)).not.toContain(FAKE_API_KEY);
  });

  it('answers 503 when the channel is down', async () => {
    const { service, connector } = setup();
    connector.verifyCredentials.mockRejectedValueOnce(
      new ChannelError(ChannelType.Falabella, ChannelErrorCode.ChannelUnavailable, 'Down'),
    );

    await expect(service.connect(WORKSPACE_ID, USER_ID, REQUEST)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('refuses with 402 when the plan has no room, and connects nothing from a sandbox', async () => {
    const { service, connector, entitlements } = setup();
    entitlements.assertInWorkspace.mockRejectedValueOnce(
      planLimitReached(Feature.ChannelConnections),
    );

    await expect(service.connect(WORKSPACE_ID, USER_ID, REQUEST)).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
    });

    entitlements.assertSandboxAllows.mockRejectedValueOnce(
      sandboxRestricted(SandboxRestriction.ConnectChannel),
    );
    connector.verifyCredentials.mockClear();
    await expect(service.connect(WORKSPACE_ID, USER_ID, REQUEST)).rejects.toBeDefined();
    expect(connector.verifyCredentials).not.toHaveBeenCalled();
  });
});
