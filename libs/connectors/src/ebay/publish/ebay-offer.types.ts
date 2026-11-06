import { z } from 'zod';
import { ebayErrorDetailSchema } from '../api/ebay-api-error.js';

/** How an offer sells; Crossmart lists at a fixed price. */
export enum EbayListingFormat {
  FixedPrice = 'FIXED_PRICE',
}

/** Whether an offer is live on eBay. */
export enum EbayOfferStatus {
  Published = 'PUBLISHED',
  Unpublished = 'UNPUBLISHED',
}

export interface EbayAmount {
  value: string;
  currency: string;
}

/** The business policies a listing is sold under. */
export interface EbayListingPolicies {
  fulfillmentPolicyId: string;
  paymentPolicyId: string;
  returnPolicyId: string;
}

/** What `PUT /offer/{offerId}` replaces: the sale terms of one SKU on the marketplace. */
export interface EbayOfferDetails {
  availableQuantity: number;
  categoryId: string;
  listingDescription: string;
  listingPolicies: EbayListingPolicies;
  pricingSummary: { price: EbayAmount };
  merchantLocationKey: string;
}

/** `POST /offer`: the details plus what identifies the offer, which never change. */
export interface EbayNewOffer extends EbayOfferDetails {
  sku: string;
  marketplaceId: string;
  format: EbayListingFormat;
}

/** What every offer of a listing shares: category, policies, location and currency. */
export interface EbayOfferTerms {
  categoryId: string;
  policies: EbayListingPolicies;
  merchantLocationKey: string;
  currency: string;
}

const offerSchema = z.object({
  offerId: z.string().min(1),
  sku: z.string(),
  status: z.string().optional(),
  /** The quantity the offer's listing shows; absent until one is set. */
  availableQuantity: z.number().int().optional(),
  listing: z.object({ listingId: z.string().optional() }).optional(),
});

export type EbayOffer = z.infer<typeof offerSchema>;

/** `GET /offer?sku=`: the SKU's offers, one per marketplace and format. */
export const ebayOffersResponseSchema = z.object({ offers: z.array(offerSchema).default([]) });

export const ebayCreatedOfferSchema = z.object({ offerId: z.string().min(1) });

/** Publishing (one offer or a group) answers the listing's id. */
export const ebayPublishedSchema = z.object({ listingId: z.string().min(1) });

/** `POST /bulk_update_price_quantity`: one status per offer (or per SKU, for stock alone). */
export const ebayBulkPriceResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        offerId: z.string().optional(),
        sku: z.string().optional(),
        statusCode: z.number().int(),
        errors: z.array(ebayErrorDetailSchema).optional(),
      }),
    )
    .default([]),
});
