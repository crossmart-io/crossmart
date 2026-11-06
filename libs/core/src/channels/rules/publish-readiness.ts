import {
  ChannelCapability,
  type ChannelConnector,
  type ChannelSettings,
  PublishRequirement,
  type UnmetPublishRequirement,
  supportsCapability,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { RECONNECT_TO_PUBLISH } from '../channels.constants.js';
import type { PublishReadiness } from '../entities/publish-readiness.js';

const RECONNECT: UnmetPublishRequirement = {
  requirement: PublishRequirement.Reconnect,
  reason: RECONNECT_TO_PUBLISH,
};

/** What the account's settings lack to publish, as the channel's connector judges them. */
function unmetAccountRequirements(
  connector: ChannelConnector,
  settings: ChannelSettings | null,
): UnmetPublishRequirement[] {
  if (!supportsCapability(connector, ChannelCapability.PublishListings)) return [];
  return connector.unmetAccountRequirements?.(settings) ?? [];
}

/**
 * Whether a store can publish: it must be connected, and its account settings must have what
 * its connector needs (eBay's policies and ship-from location, Google's listing setup). A store
 * that is not connected only asks to be connected again; the rest waits until it is.
 */
export function publishReadinessOf(
  connector: ChannelConnector,
  status: ChannelConnectionStatus,
  settings: ChannelSettings | null,
): PublishReadiness {
  const unmet =
    status === ChannelConnectionStatus.CONNECTED
      ? unmetAccountRequirements(connector, settings)
      : [RECONNECT];
  return { ready: unmet.length === 0, unmet };
}
