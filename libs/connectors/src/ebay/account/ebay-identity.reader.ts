import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { EbayApiClient } from '../api/ebay-api.client.js';
import { EBAY_USER_PATH } from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';

/** The fields Crossmart reads from `getUser`; eBay sends more (account type, business details). */
const ebayUserSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
});

export type EbayUser = z.infer<typeof ebayUserSchema>;

/** Reads who the token belongs to, through the Commerce Identity API. */
@Injectable()
export class EbayIdentityReader {
  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
  ) {}

  readUser(accessToken: string): Promise<EbayUser> {
    const url = new URL(EBAY_USER_PATH, this.app.hosts().identity);
    return this.api.get(url, accessToken, ebayUserSchema);
  }
}
