import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  ChannelConnectorRegistry,
  type ChannelType,
  isSellerCredentialsConnector,
  type SellerCredentialsConnector,
} from '@crossmart/connectors';
import { ConnectionCredentialsVault } from './connection-credentials.vault.js';

/** Finds the connector of a channel merchants connect with pasted keys, ready to connect. */
@Injectable()
export class SellerCredentialsConnectorResolver {
  constructor(
    private readonly registry: ChannelConnectorRegistry,
    private readonly vault: ConnectionCredentialsVault,
  ) {}

  /** 400 for channels connected through their app; 503 without a credentials master key. */
  requireReady(channel: ChannelType): SellerCredentialsConnector {
    const connector = this.registry.require(channel);
    if (!isSellerCredentialsConnector(connector)) {
      throw new BadRequestException(
        `${connector.displayName} is connected through its app, not with credentials`,
      );
    }
    if (!connector.isConfigured() || !this.vault.isConfigured) {
      throw new ServiceUnavailableException(
        `${connector.displayName} is not configured on this Crossmart instance`,
      );
    }
    return connector;
  }
}
