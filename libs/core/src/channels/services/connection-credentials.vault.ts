import { Injectable } from '@nestjs/common';
import { EnvelopeEncryption, type SecretScope } from '@crossmart/common';
import { type ChannelCredentials, parseChannelCredentials } from '@crossmart/connectors';
import {
  CREDENTIALS_CONTEXT_PREFIX,
  CREDENTIALS_CONTEXT_SEPARATOR,
} from '../channels.constants.js';
import type { AccountRef } from '../repositories/channel-connection.repository.js';

export interface CredentialsOwner extends AccountRef {
  workspaceId: string;
}

/**
 * Seals and opens connection credentials with the workspace's data key. The sealed value is
 * bound to its workspace, channel and account, so it cannot be copied to another connection.
 */
@Injectable()
export class ConnectionCredentialsVault {
  constructor(private readonly encryption: EnvelopeEncryption) {}

  get isConfigured(): boolean {
    return this.encryption.isConfigured;
  }

  seal(owner: CredentialsOwner, credentials: ChannelCredentials): Promise<string> {
    return this.encryption.encrypt(this.scope(owner), JSON.stringify(credentials));
  }

  async open(owner: CredentialsOwner, sealed: string): Promise<ChannelCredentials> {
    return parseChannelCredentials(await this.encryption.decrypt(this.scope(owner), sealed));
  }

  private scope({ workspaceId, channel, externalAccountId }: CredentialsOwner): SecretScope {
    const context = [CREDENTIALS_CONTEXT_PREFIX, channel, externalAccountId].join(
      CREDENTIALS_CONTEXT_SEPARATOR,
    );
    return { workspaceId, context };
  }
}
