import { randomBytes } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { AesGcmEnvelopeEncryption, InMemoryDataKeyStore, MasterKeyRing } from '@crossmart/common';
import {
  ChannelConnectorRegistry,
  ChannelError,
  ChannelErrorCode,
  ChannelType,
  type ChannelCredentials,
} from '@crossmart/connectors';
import type { Prisma } from '@crossmart/database';
import type { SealedCredentialsRecord } from '../repositories/channel-connection.queries.js';
import type { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import {
  CONNECTION_ID,
  connectionRecord,
  WORKSPACE_ID,
} from '../testing/channel-connection.fixtures.js';
import { FAKE_ACCOUNT, FakeOAuthConnector } from '../testing/fake-oauth-connector.js';
import { ChannelSessionFactory } from './channel-session.factory.js';
import { ConnectionCredentialsVault } from './connection-credentials.vault.js';

const OWNER = { workspaceId: WORKSPACE_ID, channel: 'shopify', externalAccountId: FAKE_ACCOUNT };
const inOneHour = () => new Date(Date.now() + 60 * 60_000).toISOString();
const inOneMinute = () => new Date(Date.now() + 60_000).toISOString();

async function setup(credentials?: ChannelCredentials) {
  const ring = MasterKeyRing.fromSettings({
    currentKey: randomBytes(32).toString('base64'),
    currentVersion: 1,
  });
  const vault = new ConnectionCredentialsVault(
    new AesGcmEnvelopeEncryption(ring, new InMemoryDataKeyStore()),
  );
  const stored: SealedCredentialsRecord = {
    id: CONNECTION_ID,
    ...OWNER,
    credentials: credentials ? await vault.seal(OWNER, credentials) : null,
  };
  const connector = new FakeOAuthConnector();
  const connections = {
    findForWorkspace: vi
      .fn<ChannelConnectionRepository['findForWorkspace']>()
      .mockResolvedValue(connectionRecord()),
    findSealedCredentials: vi.fn(() => Promise.resolve({ ...stored })),
    saveCredentials: vi.fn((_id: string, sealed: string) => {
      stored.credentials = sealed;
      return Promise.resolve();
    }),
    markNeedsReauth: vi.fn<ChannelConnectionRepository['markNeedsReauth']>().mockResolvedValue(),
    withCredentialsLock: vi.fn(
      (_id: string, work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        work({} as Prisma.TransactionClient),
    ),
  };
  const sessions = new ChannelSessionFactory(
    connections as unknown as ChannelConnectionRepository,
    vault,
    new ChannelConnectorRegistry([connector]),
  );
  return { sessions, connections, connector, vault, stored };
}

describe('ChannelSessionFactory', () => {
  it('serves the stored token while it is fresh, without locking', async () => {
    const { sessions, connections, connector } = await setup({
      accessToken: 'fresh',
      refreshToken: 'r',
      accessTokenExpiresAt: inOneHour(),
    });

    const session = await sessions.open(WORKSPACE_ID, CONNECTION_ID);

    expect(session.externalAccountId).toBe(FAKE_ACCOUNT);
    expect(await session.accessToken()).toBe('fresh');
    expect(connections.withCredentialsLock).not.toHaveBeenCalled();
    expect(connector.refreshCredentials).not.toHaveBeenCalled();
  });

  it('refreshes an expiring token under the lock and stores the rotated pair sealed', async () => {
    const { sessions, connections, connector, vault, stored } = await setup({
      accessToken: 'old',
      refreshToken: 'refresh-1',
      accessTokenExpiresAt: inOneMinute(),
    });

    const token = await (await sessions.open(WORKSPACE_ID, CONNECTION_ID)).accessToken();

    expect(token).toBe('token-2');
    expect(connector.refreshCredentials).toHaveBeenCalledWith(
      FAKE_ACCOUNT,
      expect.objectContaining({ refreshToken: 'refresh-1' }),
    );
    expect(connections.saveCredentials).toHaveBeenCalledWith(
      CONNECTION_ID,
      expect.any(String),
      new Date('2026-11-03T12:00:00.000Z'),
      {},
    );
    expect(stored.credentials).not.toContain('token-2');
    expect((await vault.open(OWNER, stored.credentials ?? '')).refreshToken).toBe('refresh-2');
  });

  it('marks the connection as needing re-auth when the refresh is rejected', async () => {
    const { sessions, connections, connector } = await setup({
      accessToken: 'old',
      refreshToken: 'r',
      accessTokenExpiresAt: inOneMinute(),
    });
    connector.refreshCredentials.mockRejectedValueOnce(
      new ChannelError(ChannelType.Shopify, ChannelErrorCode.CredentialsRejected, 'Connect again'),
    );

    await expect(
      (await sessions.open(WORKSPACE_ID, CONNECTION_ID)).accessToken(),
    ).rejects.toMatchObject({
      code: ChannelErrorCode.CredentialsRejected,
    });
    expect(connections.markNeedsReauth).toHaveBeenCalledWith(CONNECTION_ID, 'Connect again');
  });

  it('refuses wiped credentials and connections of other workspaces', async () => {
    const wiped = await setup();
    await expect(
      (await wiped.sessions.open(WORKSPACE_ID, CONNECTION_ID)).accessToken(),
    ).rejects.toMatchObject({
      code: ChannelErrorCode.CredentialsRejected,
    });

    const other = await setup({ accessToken: 'a' });
    other.connections.findForWorkspace.mockResolvedValueOnce(null);
    await expect(other.sessions.open('another-workspace', CONNECTION_ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});
