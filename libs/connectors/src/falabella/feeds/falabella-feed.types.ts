import { z } from 'zod';
import { xmlList, xmlObject, xmlOptionalText } from '../api/falabella-xml.js';
import { FalabellaFeedStatus } from '../falabella.enums.js';

const feedErrorSchema = z.object({
  Message: z.string(),
  SellerSku: xmlOptionalText.optional(),
});

export const feedStatusBodySchema = xmlObject({
  FeedDetail: z.object({
    Feed: z.string(),
    Status: z.enum(FalabellaFeedStatus),
    FeedErrors: xmlObject({ Error: xmlList(feedErrorSchema).optional() }).optional(),
  }),
});

/** A row a feed could not apply, and the SKU it was about when Falabella names it. */
export interface FalabellaFeedError {
  message: string;
  sellerSku: string | null;
}

/** Where a feed stood when Crossmart stopped waiting for it. */
export interface FalabellaFeedResult {
  feedId: string;
  status: FalabellaFeedStatus;
  errors: FalabellaFeedError[];
}

/** Feeds that will not change any more. */
export const SETTLED_FEED_STATUSES: ReadonlySet<FalabellaFeedStatus> = new Set([
  FalabellaFeedStatus.Finished,
  FalabellaFeedStatus.Error,
  FalabellaFeedStatus.Canceled,
]);
