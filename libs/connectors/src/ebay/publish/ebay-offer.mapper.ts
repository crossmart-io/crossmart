import type {
  ListingDraft,
  ListingDraftVariant,
} from '../../sdk/capabilities/listing-publisher.js';
import type { EbayMarketplaceId } from '../ebay-marketplace.js';
import { listedQuantity, listingDescription } from './ebay-product.mapper.js';
import {
  type EbayNewOffer,
  type EbayOfferDetails,
  type EbayOfferTerms,
  EbayListingFormat,
} from './ebay-offer.types.js';

/** The sale terms of one variant: its price and stock under the listing's shared terms. */
export function toOfferDetails(
  draft: ListingDraft,
  variant: ListingDraftVariant,
  terms: EbayOfferTerms,
): EbayOfferDetails {
  return {
    availableQuantity: listedQuantity(variant),
    categoryId: terms.categoryId,
    listingDescription: listingDescription(draft),
    listingPolicies: terms.policies,
    pricingSummary: { price: { value: variant.price, currency: terms.currency } },
    merchantLocationKey: terms.merchantLocationKey,
  };
}

/** A new offer: the details, plus the SKU, marketplace and format it is fixed to. */
export function toNewOffer(
  sku: string,
  marketplaceId: EbayMarketplaceId,
  details: EbayOfferDetails,
): EbayNewOffer {
  return { ...details, sku, marketplaceId, format: EbayListingFormat.FixedPrice };
}
