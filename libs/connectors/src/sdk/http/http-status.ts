import {
  HTTP_STATUS_SERVER_ERROR_MIN,
  HTTP_STATUS_SUCCESS_MAX,
  HTTP_STATUS_SUCCESS_MIN,
} from './http.constants.js';

export function isSuccessStatus(status: number): boolean {
  return status >= HTTP_STATUS_SUCCESS_MIN && status <= HTTP_STATUS_SUCCESS_MAX;
}

export function isServerErrorStatus(status: number): boolean {
  return status >= HTTP_STATUS_SERVER_ERROR_MIN;
}
