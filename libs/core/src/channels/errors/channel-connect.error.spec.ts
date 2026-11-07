import { ChannelError, ChannelErrorCode, ChannelType } from '@crossmart/connectors';
import { SandboxRestriction } from '../../entitlements/enums/sandbox-restriction.enum.js';
import { sandboxRestricted } from '../../entitlements/testing/sandbox-entitlements.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import { ChannelConnectError } from './channel-connect.error.js';

describe('ChannelConnectError', () => {
  it('keeps the channel’s reason next to the failure', () => {
    const error = ChannelConnectError.from(
      new ChannelError(
        ChannelType.GoogleMerchant,
        ChannelErrorCode.ChannelUnavailable,
        'The Cloud project is not registered',
      ),
    );

    expect(error.failure).toBe(ConnectFailure.ChannelUnavailable);
    expect(error.detail).toBe('channel_unavailable: The Cloud project is not registered');
    expect(error.message).toBe(
      'The channel is not responding. Try again in a moment.: channel_unavailable: The Cloud project is not registered',
    );
  });

  it('says nothing more for errors that are not the channel’s', () => {
    const error = ChannelConnectError.from(new TypeError('secret detail'));

    expect(error.failure).toBe(ConnectFailure.Unexpected);
    expect(error.message).toBe('The channel could not be connected');
  });

  it('tells an unclaimed sandbox to claim the account first', () => {
    const error = ChannelConnectError.from(sandboxRestricted(SandboxRestriction.ConnectChannel));

    expect(error.failure).toBe(ConnectFailure.SandboxClaimRequired);
    expect(error.message).toBe('Claim this account before connecting a store');
  });
});
