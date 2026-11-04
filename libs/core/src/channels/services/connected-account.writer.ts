import { Injectable } from '@nestjs/common';
import type {
  ChannelAuthorization,
  ChannelSession,
  OAuthAppConnector,
} from '@crossmart/connectors';
import type { ChannelConnectionView } from '../entities/channel-connection-view.js';
import type { OAuthStatePayload } from '../entities/oauth-state.js';
import { toChannelConnectionView } from '../mappers/channel-connection.mapper.js';
import { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { credentialsExpiry } from '../rules/credentials-expiry.js';
import { ConnectionCredentialsVault } from './connection-credentials.vault.js';

/** Stores an authorized account: reads its profile, seals its credentials, upserts the row. */
@Injectable()
export class ConnectedAccountWriter {
  constructor(
    private readonly vault: ConnectionCredentialsVault,
    private readonly connections: ChannelConnectionRepository,
  ) {}

  async save(
    state: OAuthStatePayload,
    connector: OAuthAppConnector,
    authorization: ChannelAuthorization,
  ): Promise<ChannelConnectionView> {
    const owner = {
      workspaceId: state.workspaceId,
      channel: state.channel,
      externalAccountId: authorization.externalAccountId,
    };
    const profile = await connector.describeAccount(issuedSession(authorization));
    const record = await this.connections.upsertConnected({
      ...owner,
      displayName: profile.displayName,
      sealedCredentials: await this.vault.seal(owner, authorization.credentials),
      credentialsExpiresAt: credentialsExpiry(authorization.credentials),
      grantedScopes: authorization.grantedScopes,
      settings: { account: { ...profile.settings }, productSelection: null },
      connectedById: state.userId,
      connectedAt: new Date(),
    });
    return toChannelConnectionView(record, connector);
  }
}

/** A session on credentials that were just issued and are not stored yet. */
function issuedSession(authorization: ChannelAuthorization): ChannelSession {
  return {
    connectionId: authorization.externalAccountId,
    externalAccountId: authorization.externalAccountId,
    accessToken: () => Promise.resolve(authorization.credentials.accessToken),
  };
}
