import type { GoogleTargetCountry } from '@crossmart/connectors';

/** What the merchant chooses for every Google listing: where it sells, and the product link. */
export interface GoogleListingSetupInput {
  country: GoogleTargetCountry;
  /** The product page address, with `{handle}` where the product's handle goes. */
  productUrlTemplate: string;
}
