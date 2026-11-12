import { Injectable } from '@nestjs/common';
import type {
  ChannelAccountProfile,
  ChannelAuthorization,
  ChannelConnector,
  ChannelSession,
  ChannelType,
  OAuthAppConnector,
  VerifiedSellerAccount,
} from '@crossmart/connectors';
import type { CompletedAuthorization } from '../entities/channel-connection-view.js';
import {
  emptyConnectionSettings,
  serializeConnectionSettings,
} from '../entities/connection-settings.js';
import { toChannelConnectionView } from '../mappers/channel-connection.mapper.js';
import { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { credentialsExpiry } from '../rules/credentials-expiry.js';
import { ChannelConnectionQuota } from './channel-connection.quota.js';
import {
  ConnectionCredentialsVault,
  type CredentialsOwner,
} from './connection-credentials.vault.js';

/** Who is connecting which channel, from the OAuth state or the pasted-credentials request. */
export interface ConnectingAccount {
  workspaceId: string;
  channel: ChannelType;
  userId: string;
}

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

  /** Stores an account approved through OAuth, after reading its profile. */
  async save(
    request: ConnectingAccount,
    connector: OAuthAppConnector,
    authorization: ChannelAuthorization,
  ): Promise<CompletedAuthorization> {
    await this.quota.assertCanConnect(request.workspaceId, ownerOf(request, authorization));
    const profile = await connector.describeAccount(issuedSession(authorization));
    return this.store(request, connector, authorization, profile);
  }

  /** Stores an account whose pasted credentials the channel accepted, with what it read. */
  async saveVerified(
    request: ConnectingAccount,
    connector: ChannelConnector,
    verified: VerifiedSellerAccount,
  ): Promise<CompletedAuthorization> {
    await this.quota.assertCanConnect(request.workspaceId, ownerOf(request, verified));
    return this.store(request, connector, verified, verified.profile);
  }

  private async store(
    request: ConnectingAccount,
    connector: ChannelConnector,
    authorization: ChannelAuthorization,
    profile: ChannelAccountProfile,
  ): Promise<CompletedAuthorization> {
    const owner = ownerOf(request, authorization);
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
      connectedById: request.userId,
      connectedAt: new Date(),
    });
    return { connection: toChannelConnectionView(record, connector), reconnected };
  }
}

function ownerOf(
  request: ConnectingAccount,
  authorization: ChannelAuthorization,
): CredentialsOwner {
  return {
    workspaceId: request.workspaceId,
    channel: request.channel,
    externalAccountId: authorization.externalAccountId,
  };
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
