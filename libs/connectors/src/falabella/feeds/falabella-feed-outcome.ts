import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { ERROR_DETAIL_SEPARATOR, FALABELLA_ERROR_DETAILS_SHOWN } from '../falabella.constants.js';
import { FalabellaFeedStatus } from '../falabella.enums.js';
import { falabellaError } from '../falabella-errors.js';
import type { FalabellaFeedResult } from './falabella-feed.types.js';

const REFUSED = 'Falabella refused the product: ';
const CANCELED = 'The Falabella feed was canceled before it ran';
const FAILED = 'Falabella could not process the feed';

/**
 * Throws when a feed did not apply: its first row errors, which Falabella writes for sellers
 * (`Field Brand with value 'ASM' has a problem: …`). A feed may finish with failed rows.
 */
export function assertFeedApplied(result: FalabellaFeedResult): void {
  if (result.status === FalabellaFeedStatus.Canceled) {
    throw falabellaError(ChannelErrorCode.RequestRejected, CANCELED);
  }
  if (result.errors.length > 0) {
    const shown = result.errors.slice(0, FALABELLA_ERROR_DETAILS_SHOWN);
    const messages = shown.map((error) => error.message).join(ERROR_DETAIL_SEPARATOR);
    throw falabellaError(ChannelErrorCode.RequestRejected, `${REFUSED}${messages}`);
  }
  if (result.status === FalabellaFeedStatus.Error) {
    throw falabellaError(ChannelErrorCode.RequestRejected, FAILED);
  }
}
