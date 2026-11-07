import { REDIS_KEY_PREFIX } from '@crossmart/common';

/** Redis keys of rate-limit windows: `crossmart:throttle:<hashed route and caller>`. */
export const THROTTLE_KEY_PREFIX = `${REDIS_KEY_PREFIX}throttle:`;
/** Separates the parts of a rate-limit tracker: `<workspaceId>:<principal kind>:<id>`. */
export const TRACKER_SEPARATOR = ':';
export const MS_PER_SECOND = 1000;
/** How a rate-limit tracker names a caller known only by address: `ip:<address>`. */
export const IP_TRACKER_KIND = 'ip';
/** The address of a request whose socket has none, such as in tests. */
export const UNKNOWN_CLIENT_IP = 'unknown';
/** The tracker of a request outside a workspace route, which these limits never guard. */
export const NO_WORKSPACE = 'none';

/** The window and limit of a throttled route that does not set its own. */
export const DEFAULT_THROTTLE_WINDOW_MS = 60_000;
export const DEFAULT_REQUESTS_PER_WINDOW = 30;
export const RATE_LIMITED_MESSAGE = 'Too many requests. Wait a minute and try again.';
export const RATE_LIMIT_MESSAGE_METADATA_KEY = 'crossmart:rate-limit-message';
