import type { EbayCondition, EbayShipFrom } from '@crossmart/connectors';

/** What the merchant chooses for every listing on an eBay connection. */
export interface EbayListingDefaultsInput {
  /** Null follows the account's only policy of the type, when it has exactly one. */
  fulfillmentPolicyId: string | null;
  paymentPolicyId: string | null;
  returnPolicyId: string | null;
  condition: EbayCondition;
  /** Where items ship from; Crossmart keeps it as an inventory location on eBay. */
  location: EbayShipFrom | null;
}
