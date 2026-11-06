import { HttpStatus } from '@nestjs/common';
import { ListingRetryErrorCode } from '../enums/listing-retry-error-code.enum.js';
import { RETRY_NEEDS_CONNECTION, RETRY_NEEDS_SELECTION } from '../listings.constants.js';
import { ListingRetryConflictException } from './listing-retry-conflict.exception.js';

describe('ListingRetryConflictException', () => {
  it.each([
    [ListingRetryErrorCode.StoreNotConnected, RETRY_NEEDS_CONNECTION],
    [ListingRetryErrorCode.ProductNotInStore, RETRY_NEEDS_SELECTION],
  ])('answers 409 with code %s and its message', (code, message) => {
    const error = new ListingRetryConflictException(code);

    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toEqual({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      code,
      message,
    });
  });
});
