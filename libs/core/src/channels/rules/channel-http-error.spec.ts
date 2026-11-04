import { HttpStatus } from '@nestjs/common';
import { ChannelError, ChannelErrorCode, ChannelType } from '@crossmart/connectors';
import { callChannel, toHttpException } from './channel-http-error.js';

const error = (code: ChannelErrorCode) => new ChannelError(ChannelType.Ebay, code, 'Reason');

describe('toHttpException', () => {
  it.each([
    [ChannelErrorCode.RequestRejected, HttpStatus.UNPROCESSABLE_ENTITY],
    [ChannelErrorCode.CredentialsRejected, HttpStatus.CONFLICT],
    [ChannelErrorCode.RateLimited, HttpStatus.TOO_MANY_REQUESTS],
    [ChannelErrorCode.ChannelUnavailable, HttpStatus.BAD_GATEWAY],
  ])('answers %s with %i and the channel’s message', (code, status) => {
    const exception = toHttpException(error(code));

    expect(exception.getStatus()).toBe(status);
    expect(exception.message).toBe('Reason');
  });
});

describe('callChannel', () => {
  it('maps channel errors and passes other errors through', async () => {
    const other = new Error('boom');

    await expect(
      callChannel(() => Promise.reject(error(ChannelErrorCode.RateLimited))),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    await expect(callChannel(() => Promise.reject(other))).rejects.toBe(other);
    await expect(callChannel(() => Promise.resolve(1))).resolves.toBe(1);
  });
});
