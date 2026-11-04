import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ChannelError, ChannelErrorCode, ChannelType } from '@crossmart/connectors';
import { UNEXPECTED_FAILURE_REASON } from '../../../activity/activity.constants.js';
import { isPermanentImportFailure, toImportFailureReason } from './import-failure.js';

const channelError = (code: ChannelErrorCode) =>
  new ChannelError(ChannelType.Shopify, code, 'Shown');

describe('import failures', () => {
  it.each([
    [channelError(ChannelErrorCode.CredentialsRejected), true],
    [channelError(ChannelErrorCode.RequestRejected), true],
    [channelError(ChannelErrorCode.RateLimited), false],
    [channelError(ChannelErrorCode.ChannelUnavailable), false],
    [new BadRequestException(), true],
    [new InternalServerErrorException(), false],
    [new Error('connection reset'), false],
  ])('tells permanent failures from retryable ones (%#)', (error, permanent) => {
    expect(isPermanentImportFailure(error)).toBe(permanent);
  });

  it('keeps channel messages and hides internal ones', () => {
    expect(toImportFailureReason(channelError(ChannelErrorCode.RateLimited))).toBe('Shown');
    expect(toImportFailureReason(new Error('SELECT * FROM secrets'))).toBe(
      UNEXPECTED_FAILURE_REASON,
    );
  });
});
