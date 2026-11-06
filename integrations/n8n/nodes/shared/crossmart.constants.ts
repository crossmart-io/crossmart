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

/** The header that signs every webhook delivery: `t=<unix seconds>,v1=<hex>[,v1=<hex>]`. */
export const SIGNATURE_HEADER = 'crossmart-signature';

/** The key of the signing time in the signature header. */
export const SIGNATURE_TIMESTAMP_KEY = 't';

/** The key of a signature in the signature header; repeated while a secret is being rotated. */
export const SIGNATURE_V1_KEY = 'v1';

/** Separates the parts of the signature header. */
export const SIGNATURE_PART_SEPARATOR = ',';

/** Separates a key from its value in a signature header part. */
export const SIGNATURE_KEY_SEPARATOR = '=';

/** Joins the signing time and the raw body in the signed payload: `<t>.<body>`. */
export const SIGNED_PAYLOAD_SEPARATOR = '.';

/** The HMAC hash of webhook signatures. */
export const SIGNATURE_ALGORITHM = 'sha256';

/** How far the signing time may be from now, in seconds, before a delivery counts as replayed. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export const MILLISECONDS_PER_SECOND = 1000;
