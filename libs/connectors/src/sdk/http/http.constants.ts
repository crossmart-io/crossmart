/** A channel call that takes longer than this is abandoned and retried by its caller. */
export const HTTP_REQUEST_TIMEOUT_MS = 30_000;

export const CONTENT_TYPE_HEADER = 'content-type';
export const ACCEPT_HEADER = 'accept';
export const AUTHORIZATION_HEADER = 'authorization';
export const RETRY_AFTER_HEADER = 'retry-after';
export const JSON_CONTENT_TYPE = 'application/json';
export const FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded';

export const HTTP_STATUS_NO_CONTENT = 204;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_FORBIDDEN = 403;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
export const HTTP_STATUS_SERVER_ERROR_MIN = 500;
export const HTTP_STATUS_SUCCESS_MIN = 200;
export const HTTP_STATUS_SUCCESS_MAX = 299;
