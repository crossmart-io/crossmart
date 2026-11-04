import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  type ChannelCredentials,
  ChannelConnectorRegistry,
  ChannelError,
  ChannelErrorCode,
  type ChannelSession,
  ChannelType,
  credentialsNeedRefresh,
  isOAuthAppConnector,
} from '@crossmart/connectors';
import { requireEnumValue } from '@crossmart/common';
import type { Prisma } from '@crossmart/database';
import { CONNECTION_NOT_FOUND, CREDENTIALS_REFRESH_MARGIN_MS } from '../channels.constants.js';
import type { SealedCredentialsRecord } from '../repositories/channel-connection.queries.js';
import { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { credentialsExpiry } from '../rules/credentials-expiry.js';
import { ConnectionCredentialsVault } from './connection-credentials.vault.js';

const NOT_CONNECTED = 'This channel connection has no credentials. Connect it again.';

/**
 * Opens authenticated sessions on stored connections, for every capability call (import,
 * publish, stock). Expiring tokens are refreshed under a database lock, so concurrent
 * workers never spend the same refresh token twice; a rejected refresh marks the connection
 * as needing re-authorization.
 */
@Injectable()
export class ChannelSessionFactory {
  private readonly logger = new Logger(ChannelSessionFactory.name);

  constructor(
    private readonly connections: ChannelConnectionRepository,
    private readonly vault: ConnectionCredentialsVault,
    private readonly registry: ChannelConnectorRegistry,
  ) {}

  async open(workspaceId: string, connectionId: string): Promise<ChannelSession> {
    const connection = await this.connections.findForWorkspace(workspaceId, connectionId);
    if (!connection) {
      throw new NotFoundException(CONNECTION_NOT_FOUND);
    }
    return {
      connectionId,
      externalAccountId: connection.externalAccountId,
      grantedScopes: connection.grantedScopes,
      accessToken: async () => (await this.currentCredentials(connectionId)).accessToken,
    };
  }

  private async currentCredentials(
    connectionId: string,
    now = new Date(),
  ): Promise<ChannelCredentials> {
    const credentials = await this.openStored(
      await this.connections.findSealedCredentials(connectionId),
    );
    if (!credentialsNeedRefresh(credentials, now, CREDENTIALS_REFRESH_MARGIN_MS)) {
      return credentials;
    }
    return this.connections.withCredentialsLock(connectionId, (client) =>
      this.refreshLocked(connectionId, client, now),
    );
  }

  /** Re-reads under the lock: another process may have refreshed while this one waited. */
  private async refreshLocked(
    connectionId: string,
    client: Prisma.TransactionClient,
    now: Date,
  ): Promise<ChannelCredentials> {
    const record = await this.connections.findSealedCredentials(connectionId, client);
    const credentials = await this.openStored(record);
    if (!record || !credentialsNeedRefresh(credentials, now, CREDENTIALS_REFRESH_MARGIN_MS)) {
      return credentials;
    }
    const refreshed = await this.refresh(record, credentials);
    await this.connections.saveCredentials(
      connectionId,
      await this.vault.seal(record, refreshed),
      credentialsExpiry(refreshed),
      client,
    );
    return refreshed;
  }

  private async refresh(
    record: SealedCredentialsRecord,
    credentials: ChannelCredentials,
  ): Promise<ChannelCredentials> {
    const connector = this.registry.require(requireEnumValue(ChannelType, record.channel));
    if (!isOAuthAppConnector(connector)) {
      return credentials;
    }
    try {
      return await connector.refreshCredentials(record.externalAccountId, credentials);
    } catch (error) {
      if (error instanceof ChannelError && error.code === ChannelErrorCode.CredentialsRejected) {
        this.logger.warn(`Refresh rejected for connection ${record.id}; it needs re-authorization`);
        await this.connections.markNeedsReauth(record.id, error.message);
      }
      throw error;
    }
  }

  private async openStored(record: SealedCredentialsRecord | null): Promise<ChannelCredentials> {
    if (!record) {
      throw new NotFoundException(CONNECTION_NOT_FOUND);
    }
    if (!record.credentials) {
      const channel = requireEnumValue(ChannelType, record.channel);
      throw new ChannelError(channel, ChannelErrorCode.CredentialsRejected, NOT_CONNECTED);
    }
    return this.vault.open(record, record.credentials);
  }
}
