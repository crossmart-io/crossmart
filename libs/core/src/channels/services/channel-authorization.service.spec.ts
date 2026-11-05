import { randomBytes } from 'node:crypto';
import { BadRequestException, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import {
  AesGcmEnvelopeEncryption,
  type AppConfigService,
  InMemoryDataKeyStore,
  MasterKeyRing,
} from '@crossmart/common';
import {
  ChannelConnectorRegistry,
  ChannelError,
  ChannelErrorCode,
  ChannelType,
} from '@crossmart/connectors';
import { ActivityOutcome, WorkspaceRole } from '@crossmart/database';
import { type BuiltInRole, resolveRole } from '../../tenancy/permissions/role-permissions.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import type { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { connectionRecord, USER_ID, WORKSPACE_ID } from '../testing/channel-connection.fixtures.js';
import { FAKE_ACCOUNT, FakeOAuthConnector } from '../testing/fake-oauth-connector.js';
import { ChannelAuthorizationService } from './channel-authorization.service.js';
import { ChannelConnectionQuota } from './channel-connection.quota.js';
import { ConnectedAccountWriter } from './connected-account.writer.js';
import { ConnectionCredentialsVault } from './connection-credentials.vault.js';
import { OAuthConnectorResolver } from './oauth-connector.resolver.js';
import { OAuthStateService } from './oauth-state.service.js';
import { OAuthStateSigner } from './oauth-state.signer.js';

const appConfig = {
  authSecret: 'a-test-auth-secret-of-at-least-32-chars',
  apiPublicUrl: 'http://localhost:3004',
} as AppConfigService;

function setup(role: BuiltInRole = WorkspaceRole.OWNER) {
  const connector = new FakeOAuthConnector();
  const dataKeys = new InMemoryDataKeyStore();
  const ring = MasterKeyRing.fromSettings({
    currentKey: randomBytes(32).toString('base64'),
    currentVersion: 1,
  });
  const vault = new ConnectionCredentialsVault(new AesGcmEnvelopeEncryption(ring, dataKeys));
  const connections = {
    upsertConnected: vi.fn<ChannelConnectionRepository['upsertConnected']>((record) =>
      Promise.resolve(connectionRecord({ displayName: record.displayName })),
    ),
    holdsSlot: vi.fn<ChannelConnectionRepository['holdsSlot']>().mockResolvedValue(false),
    hasReconnectCandidate: vi
      .fn<ChannelConnectionRepository['hasReconnectCandidate']>()
      .mockResolvedValue(false),
  };
  const entitlements = {
    enforced: true,
    assertInWorkspace: vi.fn<EntitlementService['assertInWorkspace']>().mockResolvedValue(),
  };
  const repository = connections as unknown as ChannelConnectionRepository;
  const quota = new ChannelConnectionQuota(
    repository,
    entitlements as unknown as EntitlementService,
  );
  const workspaceAccess = {
    findRole: vi
      .fn<WorkspaceAccessService['findRole']>()
      .mockResolvedValue(resolveRole(role, null)),
  };
  const activity = new InMemoryActivityRecorder();
  const states = new OAuthStateSigner(appConfig);
  const service = new ChannelAuthorizationService(
    new OAuthConnectorResolver(new ChannelConnectorRegistry([connector]), vault, appConfig),
    new OAuthStateService(states, workspaceAccess as unknown as WorkspaceAccessService, quota),
    new ConnectedAccountWriter(vault, repository, quota),
    activity,
  );
  const state = () =>
    states.sign({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      channel: ChannelType.Shopify,
      accountHandle: FAKE_ACCOUNT,
    });
  return { service, connector, connections, activity, vault, state, entitlements };
}

async function failureOf(promise: Promise<unknown>): Promise<ConnectFailure | undefined> {
  const error = await promise.catch((caught: unknown) => caught);
  return (error as { failure?: ConnectFailure }).failure;
}

describe('ChannelAuthorizationService', () => {
  describe('start', () => {
    it('returns the authorize URL with a signed state and the API callback', async () => {
      const { service } = setup();

      const started = await service.start(WORKSPACE_ID, USER_ID, {
        channel: ChannelType.Shopify,
        accountHandle: 'demo-store',
      });

      const url = new URL(started.authorizationUrl);
      expect(started.accountHandle).toBe(FAKE_ACCOUNT);
      expect(started.externalAccountId).toBe(FAKE_ACCOUNT);
      expect(url.searchParams.get('redirect_uri')).toBe(
        'http://localhost:3004/api/v1/channels/shopify/oauth/callback',
      );
      expect(url.searchParams.get('state')).toMatch(/^[\w-]+\.[\w-]+$/);
    });

    it('rejects invalid accounts and unconfigured connectors', async () => {
      const { service, connector } = setup();

      await expect(
        service.start(WORKSPACE_ID, USER_ID, {
          channel: ChannelType.Shopify,
          accountHandle: 'not valid',
        }),
      ).rejects.toThrow(BadRequestException);
      connector.configured = false;
      await expect(
        service.start(WORKSPACE_ID, USER_ID, { channel: ChannelType.Shopify, accountHandle: 'x' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('refuses with 402 when the plan has no room for another channel', async () => {
      const { service, entitlements } = setup();
      entitlements.assertInWorkspace.mockRejectedValueOnce(
        planLimitReached(Feature.ChannelConnections),
      );

      await expect(
        service.start(WORKSPACE_ID, USER_ID, { channel: ChannelType.Shopify, accountHandle: 'x' }),
      ).rejects.toMatchObject({ status: HttpStatus.PAYMENT_REQUIRED });
      expect(entitlements.assertInWorkspace).toHaveBeenCalledWith(
        WORKSPACE_ID,
        Feature.ChannelConnections,
      );
    });

    it('lets a merchant repair a connection they hold, whatever the plan', async () => {
      const { service, connections, entitlements } = setup();
      connections.hasReconnectCandidate.mockResolvedValueOnce(true);

      await service.start(WORKSPACE_ID, USER_ID, {
        channel: ChannelType.Shopify,
        accountHandle: 'x',
      });
      expect(entitlements.assertInWorkspace).not.toHaveBeenCalled();
    });

    it('checks nothing while plans are not enforced', async () => {
      const { service, connections, entitlements } = setup();
      entitlements.enforced = false;

      await service.start(WORKSPACE_ID, USER_ID, {
        channel: ChannelType.Shopify,
        accountHandle: 'x',
      });
      expect(connections.hasReconnectCandidate).not.toHaveBeenCalled();
      expect(entitlements.assertInWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('stores nothing when the plan filled up meanwhile, and says why', async () => {
      const { service, connections, activity, entitlements, state } = setup();
      entitlements.assertInWorkspace.mockRejectedValueOnce(
        planLimitReached(Feature.ChannelConnections),
      );

      const failure = await failureOf(
        service.complete(ChannelType.Shopify, {
          query: { state: state(), code: 'c' },
          sessionUserId: USER_ID,
        }),
      );

      expect(failure).toBe(ConnectFailure.PlanLimitReached);
      expect(connections.upsertConnected).not.toHaveBeenCalled();
      expect(activity.entries[0]).toMatchObject({
        action: ActivityAction.ChannelConnectFailed,
        outcome: ActivityOutcome.FAILED,
      });
    });

    it('lets an account the workspace holds connect again', async () => {
      const { service, connections, entitlements, state } = setup();
      connections.holdsSlot.mockResolvedValueOnce(true);

      await service.complete(ChannelType.Shopify, {
        query: { state: state(), code: 'c' },
        sessionUserId: USER_ID,
      });
      expect(entitlements.assertInWorkspace).not.toHaveBeenCalled();
      expect(connections.upsertConnected).toHaveBeenCalled();
    });

    it('stores sealed credentials and records the connection', async () => {
      const { service, connector, connections, activity, vault, state } = setup();

      const view = await service.complete(ChannelType.Shopify, {
        query: { state: state(), code: 'c' },
        sessionUserId: USER_ID,
      });

      expect(view.displayName).toBe('Demo Store');
      expect(connector.completeAuthorization).toHaveBeenCalledWith(
        expect.objectContaining({
          accountHandle: FAKE_ACCOUNT,
          query: { state: expect.any(String), code: 'c' },
        }),
      );
      const [stored] = connections.upsertConnected.mock.calls[0];
      expect(stored.sealedCredentials).not.toContain('token-1');
      expect(stored.credentialsExpiresAt).toEqual(new Date('2026-11-03T11:00:00.000Z'));
      expect(stored.settings).toEqual({
        account: { channel: 'shopify' },
        productSelection: null,
        pricing: null,
      });
      const opened = await vault.open(
        { workspaceId: WORKSPACE_ID, channel: 'shopify', externalAccountId: FAKE_ACCOUNT },
        stored.sealedCredentials,
      );
      expect(opened.accessToken).toBe('token-1');
      expect(activity.entries).toEqual([
        expect.objectContaining({ action: ActivityAction.ChannelConnected, detail: 'Shopify' }),
      ]);
    });

    it('rejects forged states without calling the channel or logging activity', async () => {
      const { service, connector, activity } = setup();

      expect(
        await failureOf(
          service.complete(ChannelType.Shopify, {
            query: { state: 'forged' },
            sessionUserId: null,
          }),
        ),
      ).toBe(ConnectFailure.InvalidState);
      expect(connector.completeAuthorization).not.toHaveBeenCalled();
      expect(activity.recorded).toEqual([]);
    });

    it('rejects a state followed by another signed-in user', async () => {
      const { service, state } = setup();

      expect(
        await failureOf(
          service.complete(ChannelType.Shopify, {
            query: { state: state() },
            sessionUserId: WORKSPACE_ID,
          }),
        ),
      ).toBe(ConnectFailure.InvalidState);
    });

    it('records a failure when the user lost access, or the connector refuses the account', async () => {
      const lostAccess = setup(WorkspaceRole.VIEWER);
      expect(
        await failureOf(
          lostAccess.service.complete(ChannelType.Shopify, {
            query: { state: lostAccess.state() },
            sessionUserId: null,
          }),
        ),
      ).toBe(ConnectFailure.NotPermitted);
      expect(lostAccess.activity.recorded[0].entry).toMatchObject({
        action: ActivityAction.ChannelConnectFailed,
        outcome: ActivityOutcome.FAILED,
        failureReason: 'You can no longer manage this workspace',
      });

      const otherStore = setup();
      otherStore.connector.completeAuthorization.mockRejectedValueOnce(
        new ChannelError(ChannelType.Shopify, ChannelErrorCode.InvalidAccount, 'other store'),
      );
      expect(
        await failureOf(
          otherStore.service.complete(ChannelType.Shopify, {
            query: { state: otherStore.state() },
            sessionUserId: null,
          }),
        ),
      ).toBe(ConnectFailure.InvalidAccount);
      expect(otherStore.connections.upsertConnected).not.toHaveBeenCalled();
      expect(otherStore.activity.recorded[0].entry).toMatchObject({
        action: ActivityAction.ChannelConnectFailed,
        subject: { label: FAKE_ACCOUNT },
      });
    });

    it('maps channel errors and declined approvals to failures', async () => {
      const { service, connector, state } = setup();
      connector.completeAuthorization.mockRejectedValueOnce(
        new ChannelError(ChannelType.Shopify, ChannelErrorCode.InvalidSignature, 'bad hmac'),
      );

      expect(
        await failureOf(
          service.complete(ChannelType.Shopify, { query: { state: state() }, sessionUserId: null }),
        ),
      ).toBe(ConnectFailure.InvalidSignature);
      expect(
        await failureOf(
          service.complete(ChannelType.Shopify, {
            query: { state: state(), error: 'access_denied' },
            sessionUserId: null,
          }),
        ),
      ).toBe(ConnectFailure.AccessDenied);
      connector.completeAuthorization.mockRejectedValueOnce(new Error('boom'));
      expect(
        await failureOf(
          service.complete(ChannelType.Shopify, { query: { state: state() }, sessionUserId: null }),
        ),
      ).toBe(ConnectFailure.Unexpected);
    });
  });
});
