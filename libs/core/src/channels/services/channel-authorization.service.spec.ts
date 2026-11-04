import { randomBytes } from 'node:crypto';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
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
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import type { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { connectionRecord, USER_ID, WORKSPACE_ID } from '../testing/channel-connection.fixtures.js';
import { FAKE_ACCOUNT, FakeOAuthConnector } from '../testing/fake-oauth-connector.js';
import { ChannelAuthorizationService } from './channel-authorization.service.js';
import { ConnectedAccountWriter } from './connected-account.writer.js';
import { ConnectionCredentialsVault } from './connection-credentials.vault.js';
import { OAuthConnectorResolver } from './oauth-connector.resolver.js';
import { OAuthStateService } from './oauth-state.service.js';
import { OAuthStateSigner } from './oauth-state.signer.js';

const appConfig = {
  authSecret: 'a-test-auth-secret-of-at-least-32-chars',
  apiPublicUrl: 'http://localhost:3004',
} as AppConfigService;

function setup(role: WorkspaceRole = WorkspaceRole.OWNER) {
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
  };
  const workspaceAccess = {
    findRole: vi.fn<WorkspaceAccessService['findRole']>().mockResolvedValue(role),
  };
  const activity = new InMemoryActivityRecorder();
  const states = new OAuthStateSigner(appConfig);
  const service = new ChannelAuthorizationService(
    new OAuthConnectorResolver(new ChannelConnectorRegistry([connector]), vault, appConfig),
    new OAuthStateService(states, workspaceAccess as unknown as WorkspaceAccessService),
    new ConnectedAccountWriter(vault, connections as unknown as ChannelConnectionRepository),
    activity,
  );
  const state = () =>
    states.sign({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      channel: ChannelType.Shopify,
      externalAccountId: FAKE_ACCOUNT,
    });
  return { service, connector, connections, activity, vault, state };
}

async function failureOf(promise: Promise<unknown>): Promise<ConnectFailure | undefined> {
  const error = await promise.catch((caught: unknown) => caught);
  return (error as { failure?: ConnectFailure }).failure;
}

describe('ChannelAuthorizationService', () => {
  describe('start', () => {
    it('returns the authorize URL with a signed state and the API callback', () => {
      const { service } = setup();

      const started = service.start(WORKSPACE_ID, USER_ID, {
        channel: ChannelType.Shopify,
        accountHandle: 'demo-store',
      });

      const url = new URL(started.authorizationUrl);
      expect(started.externalAccountId).toBe(FAKE_ACCOUNT);
      expect(url.searchParams.get('redirect_uri')).toBe(
        'http://localhost:3004/api/v1/channels/shopify/oauth/callback',
      );
      expect(url.searchParams.get('state')).toMatch(/^[\w-]+\.[\w-]+$/);
    });

    it('rejects invalid accounts and unconfigured connectors', () => {
      const { service, connector } = setup();

      expect(() =>
        service.start(WORKSPACE_ID, USER_ID, {
          channel: ChannelType.Shopify,
          accountHandle: 'not valid',
        }),
      ).toThrow(BadRequestException);
      connector.configured = false;
      expect(() =>
        service.start(WORKSPACE_ID, USER_ID, { channel: ChannelType.Shopify, accountHandle: 'x' }),
      ).toThrow(ServiceUnavailableException);
    });
  });

  describe('complete', () => {
    it('stores sealed credentials and records the connection', async () => {
      const { service, connections, activity, vault, state } = setup();

      const view = await service.complete(ChannelType.Shopify, {
        query: { state: state(), code: 'c' },
        sessionUserId: USER_ID,
      });

      expect(view.displayName).toBe('Demo Store');
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

    it('records a failure when the user lost access, or the channel answers for another store', async () => {
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
      otherStore.connector.authorization = {
        ...otherStore.connector.authorization,
        externalAccountId: 'other.myshopify.com',
      };
      expect(
        await failureOf(
          otherStore.service.complete(ChannelType.Shopify, {
            query: { state: otherStore.state() },
            sessionUserId: null,
          }),
        ),
      ).toBe(ConnectFailure.InvalidAccount);
      expect(otherStore.connections.upsertConnected).not.toHaveBeenCalled();
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
