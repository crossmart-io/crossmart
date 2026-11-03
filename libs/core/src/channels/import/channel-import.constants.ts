import { ChannelType } from '@crossmart/connectors';
import { CatalogImportFormat } from '../../catalog/enums/catalog-import-format.enum.js';

/** The BullMQ job that imports one channel's catalog, on the `import` queue. */
export const CHANNEL_IMPORT_JOB_NAME = 'channel-catalog-import';
/** Tries per import. Each retry resumes from the stored cursor, so none redoes written pages. */
export const CHANNEL_IMPORT_ATTEMPTS = 5;
export const CHANNEL_IMPORT_BACKOFF_MS = 30_000;
/** Finished BullMQ jobs kept in Redis; the import history lives in Postgres. */
export const CHANNEL_IMPORT_KEEP_COMPLETED = 100;
export const CHANNEL_IMPORT_KEEP_FAILED = 500;

/** Serializes starting imports of one connection, so two clicks start one import. */
export const CHANNEL_IMPORT_LOCK_PREFIX = 'channel-import:';

/** The import format of each channel whose catalog Crossmart can import. */
export const CHANNEL_IMPORT_FORMATS: Partial<Record<ChannelType, CatalogImportFormat>> = {
  [ChannelType.Shopify]: CatalogImportFormat.ShopifyApi,
};

export const IMPORT_NOT_SUPPORTED = 'This channel cannot import its catalog';
export const CONNECTION_NOT_CONNECTED =
  'This channel connection is not connected. Connect it again before importing.';
export const IMPORT_QUEUE_UNAVAILABLE = 'The import could not be queued. Try again in a minute.';
