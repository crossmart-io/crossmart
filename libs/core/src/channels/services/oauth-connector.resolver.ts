import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import {
  ChannelConnectorRegistry,
  type ChannelType,
  isOAuthAppConnector,
  type OAuthAppConnector,
} from '@crossmart/connectors';
import { CHANNEL_OAUTH_CALLBACK_PATH, CHANNEL_PATH_PARAM } from '../channels.constants.js';
import { ConnectionCredentialsVault } from './connection-credentials.vault.js';

/** Finds the OAuth connector of a channel, ready to connect, and the callback URL it uses. */
@Injectable()
export class OAuthConnectorResolver {
  constructor(
    private readonly registry: ChannelConnectorRegistry,
    private readonly vault: ConnectionCredentialsVault,
    private readonly appConfig: AppConfigService,
  ) {}

  /** 400 for channels connected another way; 503 when the app or the master key is missing. */
  requireReady(channel: ChannelType): OAuthAppConnector {
    const connector = this.registry.require(channel);
    if (!isOAuthAppConnector(connector)) {
      throw new BadRequestException(
        `${connector.displayName} is connected with credentials, not OAuth`,
      );
    }
    if (!connector.isConfigured() || !this.vault.isConfigured) {
      throw new ServiceUnavailableException(
        `${connector.displayName} is not configured on this Crossmart instance`,
      );
    }
    return connector;
  }

  displayName(channel: ChannelType): string | undefined {
    return this.registry.find(channel)?.displayName;
  }

  /** The callback URL registered with the channel's app, under the API's public URL. */
  redirectUri(channel: ChannelType): string {
    const path = CHANNEL_OAUTH_CALLBACK_PATH.replace(CHANNEL_PATH_PARAM, channel);
    return new URL(path, this.appConfig.apiPublicUrl).toString();
  }
}
