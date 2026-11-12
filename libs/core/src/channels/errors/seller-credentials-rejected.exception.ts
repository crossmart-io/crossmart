import { HttpException, HttpStatus } from '@nestjs/common';
import type { ConnectFailure } from '../enums/connect-failure.enum.js';

const UNPROCESSABLE_ENTITY_ERROR = 'Unprocessable Entity';

/** The body of a 422: NestJS's error shape, and why the channel refused the credentials. */
export interface SellerCredentialsErrorBody {
  statusCode: HttpStatus.UNPROCESSABLE_ENTITY;
  error: string;
  failure: ConnectFailure;
  /** The channel's explanation, written for merchants; it never holds the credentials. */
  message: string;
}

/**
 * The channel refused pasted credentials, or the account they name. HTTP 422: the request was
 * well formed, and the merchant fixes it by pasting other values.
 */
export class SellerCredentialsRejectedException extends HttpException {
  constructor(failure: ConnectFailure, message: string) {
    const body: SellerCredentialsErrorBody = {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: UNPROCESSABLE_ENTITY_ERROR,
      failure,
      message,
    };
    super(body, HttpStatus.UNPROCESSABLE_ENTITY);
    this.name = 'SellerCredentialsRejectedException';
  }
}
