import { REDIS_KEY_PREFIX } from '@crossmart/common';

/** Redis keys of rate-limit windows: `crossmart:throttle:<hashed route and caller>`. */
export const THROTTLE_KEY_PREFIX = `${REDIS_KEY_PREFIX}throttle:`;
/** Separates the parts of a rate-limit tracker: `<workspaceId>:<principal kind>:<id>`. */
export const TRACKER_SEPARATOR = ':';
export const MS_PER_SECOND = 1000;
/** The tracker of a request outside a workspace route, which these limits never guard. */
export const NO_WORKSPACE = 'none';
