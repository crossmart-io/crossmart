/** A channel call that takes longer than this is abandoned and retried by its caller. */
export const HTTP_REQUEST_TIMEOUT_MS = 30_000;

export const CONTENT_TYPE_HEADER = 'content-type';
export const ACCEPT_HEADER = 'accept';
export const AUTHORIZATION_HEADER = 'authorization';
export const RETRY_AFTER_HEADER = 'retry-after';
export const JSON_CONTENT_TYPE = 'application/json';
export const FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded';
export const MULTIPART_FORM_CONTENT_TYPE = 'multipart/form-data';

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

/** HTTP authentication schemes (RFC 7617 Basic, RFC 6750 Bearer). */
export const BASIC_AUTH_SCHEME = 'Basic';
export const BEARER_AUTH_SCHEME = 'Bearer';
/** Joins the user id and the password in Basic credentials. */
export const BASIC_CREDENTIALS_SEPARATOR = ':';
export const BASIC_CREDENTIALS_ENCODING = 'base64';
