import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { Sleeper } from '../../sdk/time/sleeper.js';
import type { FalabellaAccount } from '../api/falabella-account.js';
import { FalabellaApiClient } from '../api/falabella-api.client.js';
import { buildFalabellaRequest } from '../api/falabella-xml.js';
import {
  FALABELLA_FEED_POLL_ATTEMPTS,
  FALABELLA_FEED_POLL_INTERVAL_MS,
  FalabellaParam,
} from '../falabella.constants.js';
import { FalabellaAction } from '../falabella.enums.js';
import { FALABELLA_ERROR_MESSAGES, falabellaError } from '../falabella-errors.js';
import {
  type FalabellaFeedResult,
  feedStatusBodySchema,
  SETTLED_FEED_STATUSES,
} from './falabella-feed.types.js';

const NO_FEED_ID = 'Falabella accepted the request but gave no feed id';

/** A write Falabella queues as a feed: ProductCreate, ProductUpdate or Image. */
export type FalabellaFeedAction =
  FalabellaAction.ProductCreate | FalabellaAction.ProductUpdate | FalabellaAction.Image;

/**
 * Sends writes, which Falabella queues as feeds, and waits a bounded time for each to run,
 * so its row errors reach the merchant. A feed still queued when the wait ends is returned as
 * it stands; Falabella runs it later.
 */
@Injectable()
export class FalabellaFeedClient {
  constructor(
    private readonly api: FalabellaApiClient,
    private readonly sleeper: Sleeper,
  ) {}

  /** Sends `<Request>` with `content` as a feed, then waits for its result. */
  async run(
    account: FalabellaAccount,
    action: FalabellaFeedAction,
    content: Readonly<Record<string, unknown>>,
  ): Promise<FalabellaFeedResult> {
    const feedId = await this.submit(account, action, content);
    return this.waitFor(account, feedId);
  }

  private async submit(
    account: FalabellaAccount,
    action: FalabellaFeedAction,
    content: Readonly<Record<string, unknown>>,
  ): Promise<string> {
    const { head } = await this.api.call(
      account,
      { action, xml: buildFalabellaRequest(content) },
      z.unknown(),
    );
    if (!head.RequestId) {
      throw falabellaError(
        ChannelErrorCode.ChannelUnavailable,
        `${FALABELLA_ERROR_MESSAGES[ChannelErrorCode.ChannelUnavailable]} ${NO_FEED_ID}`,
      );
    }
    return head.RequestId;
  }

  private async waitFor(account: FalabellaAccount, feedId: string): Promise<FalabellaFeedResult> {
    let result = await this.status(account, feedId);
    for (let attempt = 1; attempt < FALABELLA_FEED_POLL_ATTEMPTS; attempt += 1) {
      if (SETTLED_FEED_STATUSES.has(result.status)) return result;
      await this.sleeper.sleep(FALABELLA_FEED_POLL_INTERVAL_MS);
      result = await this.status(account, feedId);
    }
    return result;
  }

  private async status(account: FalabellaAccount, feedId: string): Promise<FalabellaFeedResult> {
    const { body } = await this.api.call(
      account,
      { action: FalabellaAction.FeedStatus, params: { [FalabellaParam.FeedId]: feedId } },
      feedStatusBodySchema,
    );
    const detail = body.FeedDetail;
    return {
      feedId,
      status: detail.Status,
      errors: (detail.FeedErrors?.Error ?? []).map((error) => ({
        message: error.Message,
        sellerSku: error.SellerSku ?? null,
      })),
    };
  }
}
