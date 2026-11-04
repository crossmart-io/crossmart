import type { ChannelType } from './channel-type.enum.js';

/**
 * Account settings a connector reads on connect (currency, location) and stores on the
 * connection. Each connector extends this with its own typed, validated fields.
 */
export interface ChannelSettings {
  readonly channel: ChannelType;
}

/** What a connector learns about an account when it is connected. */
export interface ChannelAccountProfile<TSettings extends ChannelSettings = ChannelSettings> {
  displayName: string;
  settings: TSettings;
}
