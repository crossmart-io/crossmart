import {
  ChannelCapability,
  type ChannelConnector,
  type ListingPublisher,
  PublishRequirement,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { RECONNECT_TO_PUBLISH } from '../channels.constants.js';
import { publishReadinessOf } from './publish-readiness.js';

const NO_POLICY = { requirement: PublishRequirement.ShippingPolicy, reason: 'Choose a policy' };

function connector(
  capabilities: ChannelCapability[],
  unmet = [NO_POLICY],
): { connector: ChannelConnector; check: ReturnType<typeof vi.fn> } {
  const check = vi.fn<NonNullable<ListingPublisher['unmetAccountRequirements']>>(() => unmet);
  const double = { capabilities: new Set(capabilities), unmetAccountRequirements: check };
  return { connector: double as unknown as ChannelConnector, check };
}

describe('publishReadinessOf', () => {
  it('asks the connector what a connected store’s settings lack', () => {
    const { connector: publisher, check } = connector([ChannelCapability.PublishListings]);

    const readiness = publishReadinessOf(publisher, ChannelConnectionStatus.CONNECTED, null);

    expect(readiness).toEqual({ ready: false, unmet: [NO_POLICY] });
    expect(check).toHaveBeenCalledWith(null);
  });

  it('is ready when the connector finds nothing missing', () => {
    const { connector: publisher } = connector([ChannelCapability.PublishListings], []);

    expect(publishReadinessOf(publisher, ChannelConnectionStatus.CONNECTED, null)).toEqual({
      ready: true,
      unmet: [],
    });
  });

  it.each([
    ChannelConnectionStatus.NEEDS_REAUTH,
    ChannelConnectionStatus.DISCONNECTED,
    ChannelConnectionStatus.ERROR,
  ])('only asks a %s store to be connected again', (status) => {
    const { connector: publisher, check } = connector([ChannelCapability.PublishListings]);

    expect(publishReadinessOf(publisher, status, null)).toEqual({
      ready: false,
      unmet: [{ requirement: PublishRequirement.Reconnect, reason: RECONNECT_TO_PUBLISH }],
    });
    expect(check).not.toHaveBeenCalled();
  });

  it('does not ask a connector that cannot publish', () => {
    const { connector: reader, check } = connector([ChannelCapability.ImportCatalog]);

    expect(publishReadinessOf(reader, ChannelConnectionStatus.CONNECTED, null).ready).toBe(true);
    expect(check).not.toHaveBeenCalled();
  });
});
