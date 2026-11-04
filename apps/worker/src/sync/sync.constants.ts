import { QueueName } from '@crossmart/common';

/** Jobs each queue runs at once per worker: inventory most, so stock never waits. */
export const SYNC_QUEUE_CONCURRENCY = {
  [QueueName.Inventory]: 10,
  [QueueName.Price]: 5,
  [QueueName.Content]: 3,
} as const;

export const MILLISECONDS_PER_SECOND = 1000;
export const RATE_LIMIT_KEY_SEPARATOR = ':';
