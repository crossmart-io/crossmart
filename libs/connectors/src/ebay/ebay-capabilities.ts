import { Injectable } from '@nestjs/common';
import { EbayBusinessPoliciesOptIn } from './account/ebay-business-policies.opt-in.js';
import { EbayBusinessPoliciesReader } from './account/ebay-business-policies.reader.js';
import { EbayIdentityReader } from './account/ebay-identity.reader.js';
import { EbayLocationWriter } from './account/ebay-location.writer.js';
import { EbayListingPublisher } from './publish/ebay-listing-publisher.js';
import { EbayPriceUpdater } from './publish/ebay-price-updater.js';
import { EbayTaxonomyReader } from './taxonomy/ebay-taxonomy.reader.js';

/** What the connector reads and sets up on the account: identity, policies and location. */
@Injectable()
export class EbayAccountServices {
  constructor(
    readonly identity: EbayIdentityReader,
    readonly policies: EbayBusinessPoliciesReader,
    readonly policiesOptIn: EbayBusinessPoliciesOptIn,
    readonly location: EbayLocationWriter,
  ) {}
}

/** What the connector sells through: listings, their prices, and the categories they go in. */
@Injectable()
export class EbaySellingServices {
  constructor(
    readonly publisher: EbayListingPublisher,
    readonly prices: EbayPriceUpdater,
    readonly taxonomy: EbayTaxonomyReader,
  ) {}
}
