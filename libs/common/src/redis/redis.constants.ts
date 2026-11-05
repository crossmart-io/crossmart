/** Every key Crossmart writes to Redis starts with this, apart from BullMQ's own. */
export const REDIS_KEY_PREFIX = 'crossmart:';
/** Keys of claimed one-time values: `crossmart:replay:<key>`. */
export const REPLAY_KEY_PREFIX = `${REDIS_KEY_PREFIX}replay:`;
/** The value stored under a claimed key; only its presence matters. */
export const REPLAY_MARKER = '1';
