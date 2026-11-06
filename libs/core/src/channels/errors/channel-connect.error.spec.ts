import { ChannelError, ChannelErrorCode, ChannelType } from '@crossmart/connectors';
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
});
