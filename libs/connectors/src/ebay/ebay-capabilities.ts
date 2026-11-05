import { Injectable } from '@nestjs/common';
import { EbayBusinessPoliciesReader } from './account/ebay-business-policies.reader.js';
import { EbayBusinessPoliciesWriter } from './account/ebay-business-policies.writer.js';
import { EbayIdentityReader } from './account/ebay-identity.reader.js';
import { EbayLocationWriter } from './account/ebay-location.writer.js';
import { EbayListingPublisher } from './publish/ebay-listing-publisher.js';
import { EbayPriceUpdater } from './publish/ebay-price-updater.js';
import { EbayCategoryAspectsReader } from './taxonomy/ebay-category-aspects.reader.js';
import { EbayTaxonomyReader } from './taxonomy/ebay-taxonomy.reader.js';

/**
 * What the connector reads and sets up on the account: identity, business policies (read,
 * opted in to and created) and the ship-from location.
 */
@Injectable()
export class EbayAccountServices {
  constructor(
    readonly identity: EbayIdentityReader,
    readonly policies: EbayBusinessPoliciesReader,
    readonly policySetup: EbayBusinessPoliciesWriter,
    readonly location: EbayLocationWriter,
  ) {}
}

/**
 * What the connector sells through: listings, their prices, the categories they go in and
 * those categories' item specifics.
 */
@Injectable()
export class EbaySellingServices {
  constructor(
    readonly publisher: EbayListingPublisher,
    readonly prices: EbayPriceUpdater,
    readonly taxonomy: EbayTaxonomyReader,
    readonly aspects: EbayCategoryAspectsReader,
  ) {}
}
