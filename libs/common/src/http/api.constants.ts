export const API_GLOBAL_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';

export const OPENAPI_DOCS_PATH = 'api/docs';
export const OPENAPI_TITLE = 'Crossmart API';
export const OPENAPI_DESCRIPTION =
  'REST API of Crossmart, the open-source multichannel platform for sellers and their AI agents.';
export const OPENAPI_OUTPUT_FILE = 'openapi.json';
export const OPENAPI_ONLY_FLAG = '--openapi-only';

export const API_KEY_HEADER = 'x-api-key';

/** The names the OpenAPI document gives its security schemes (`@nestjs/swagger` defaults). */
export enum OpenApiSecurityScheme {
  ApiKey = 'api_key',
  SessionCookie = 'cookie',
}
