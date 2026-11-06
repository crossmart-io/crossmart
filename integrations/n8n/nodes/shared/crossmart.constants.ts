/** The credential type every Crossmart node authenticates with. */
export const CREDENTIAL_TYPE = 'crossmartApi';

/** Where the hosted Crossmart API answers. Self-hosted installs set their own base URL. */
export const DEFAULT_BASE_URL = 'https://api.crossmart.io';

/** The versioned prefix of every REST route. */
export const API_VERSION_PREFIX = '/api/v1';

/** Header that carries a workspace API key. */
export const API_KEY_HEADER = 'x-api-key';

/** Largest page the API serves; "Return All" asks for it to make as few requests as possible. */
export const MAX_PAGE_SIZE = 100;

/** How many items "Get Many" returns when "Return All" is off. */
export const DEFAULT_RETURN_LIMIT = 50;

/** Separates the values of a comma-separated parameter, such as tags. */
export const LIST_SEPARATOR = ',';

/** Matches the trailing slashes of a base URL. */
export const TRAILING_SLASHES = /\/+$/;

/** The help text n8n shows under a dropdown filled from the API. */
export const EXPRESSION_HINT =
	'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>';

export const API_KEY_DOCUMENTATION_URL =
	'https://github.com/crossmart-io/crossmart/blob/main/docs/developers/README.md#api-keys';
