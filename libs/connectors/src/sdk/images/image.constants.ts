/** The largest image Crossmart downloads to upload to a channel. */
export const IMAGE_MAX_BYTES = 20 * 1024 * 1024;
/** A download that takes longer than this is abandoned. */
export const IMAGE_FETCH_TIMEOUT_MS = 30_000;
export const IMAGE_CONTENT_TYPE_PREFIX = 'image/';
export const IMAGE_ACCEPT_HEADER_VALUE = 'image/*';
export const DEFAULT_IMAGE_FILE_NAME = 'image';
export const FILE_EXTENSION_SEPARATOR = '.';
export const PATH_SEPARATOR = '/';
/** The media type ends where its parameters start: `image/jpeg; charset=…`. */
export const MEDIA_TYPE_PARAMETER_SEPARATOR = ';';
