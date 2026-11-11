import { Injectable } from '@nestjs/common';
import type {
  ChannelAuthorization,
  ChannelSession,
  OAuthAppConnector,
} from '@crossmart/connectors';
import type { CompletedAuthorization } from '../entities/channel-connection-view.js';
import {
  emptyConnectionSettings,
  serializeConnectionSettings,
} from '../entities/connection-settings.js';
import type { OAuthStatePayload } from '../entities/oauth-state.js';
import { toChannelConnectionView } from '../mappers/channel-connection.mapper.js';
import { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { credentialsExpiry } from '../rules/credentials-expiry.js';
import { ChannelConnectionQuota } from './channel-connection.quota.js';
import { ConnectionCredentialsVault } from './connection-credentials.vault.js';

/**
 * Stores an authorized account, while the plan has room for it: reads its profile, seals its
 * credentials, upserts the row. Says whether the account was connected before.
 */
@Injectable()
export class ConnectedAccountWriter {
  constructor(
    private readonly vault: ConnectionCredentialsVault,
    private readonly connections: ChannelConnectionRepository,
    private readonly quota: ChannelConnectionQuota,
  ) {}

  async save(
    state: OAuthStatePayload,
    connector: OAuthAppConnector,
    authorization: ChannelAuthorization,
  ): Promise<CompletedAuthorization> {
    const owner = {
      workspaceId: state.workspaceId,
      channel: state.channel,
      externalAccountId: authorization.externalAccountId,
    };
    await this.quota.assertCanConnect(state.workspaceId, owner);
    const profile = await connector.describeAccount(issuedSession(authorization));
    const { record, reconnected } = await this.connections.upsertConnected({
      ...owner,
      displayName: profile.displayName,
      sealedCredentials: await this.vault.seal(owner, authorization.credentials),
      credentialsExpiresAt: credentialsExpiry(authorization.credentials),
      grantedScopes: authorization.grantedScopes,
      settings: serializeConnectionSettings({
        ...emptyConnectionSettings(),
        account: profile.settings,
      }),
      connectedById: state.userId,
      connectedAt: new Date(),
    });
    return { connection: toChannelConnectionView(record, connector), reconnected };
  }
}

/** A session on credentials that were just issued and are not stored yet. */
function issuedSession(authorization: ChannelAuthorization): ChannelSession {
  return {
    connectionId: authorization.externalAccountId,
    externalAccountId: authorization.externalAccountId,
    grantedScopes: authorization.grantedScopes,
    accessToken: () => Promise.resolve(authorization.credentials.accessToken),
  };
}
