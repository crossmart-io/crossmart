import { ConflictException, HttpStatus } from '@nestjs/common';
import { ListingRetryErrorCode } from '../enums/listing-retry-error-code.enum.js';
import {
  CONFLICT_ERROR,
  RETRY_NEEDS_CONNECTION,
  RETRY_NEEDS_SELECTION,
} from '../listings.constants.js';

/** The body of a refused retry: NestJS's error shape plus a `code` clients can branch on. */
export interface ListingRetryConflictBody {
  statusCode: HttpStatus.CONFLICT;
  error: string;
  code: ListingRetryErrorCode;
  message: string;
}

/** The merchant-readable message of each refusal. */
const RETRY_CONFLICT_MESSAGES: Record<ListingRetryErrorCode, string> = {
  [ListingRetryErrorCode.StoreNotConnected]: RETRY_NEEDS_CONNECTION,
  [ListingRetryErrorCode.ProductNotInStore]: RETRY_NEEDS_SELECTION,
};

/** A retry the store's state refuses (409): reconnect the store, or add the product to it. */
export class ListingRetryConflictException extends ConflictException {
  constructor(readonly code: ListingRetryErrorCode) {
    super(ListingRetryConflictException.body(code));
    this.name = 'ListingRetryConflictException';
  }

  private static body(code: ListingRetryErrorCode): ListingRetryConflictBody {
    return {
      statusCode: HttpStatus.CONFLICT,
      error: CONFLICT_ERROR,
      code,
      message: RETRY_CONFLICT_MESSAGES[code],
    };
  }
}
