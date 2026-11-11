/** Google's money: an amount in millionths, as a string, and its currency. */
export interface GooglePrice {
  amountMicros: string;
  currencyCode: string;
}

export enum GoogleAvailability {
  InStock = 'IN_STOCK',
  OutOfStock = 'OUT_OF_STOCK',
  Backorder = 'BACKORDER',
}

/** `ProductAttributes.condition` in the Merchant API. */
export enum GoogleCondition {
  New = 'NEW',
  Used = 'USED',
  Refurbished = 'REFURBISHED',
}

/** The product attributes Crossmart sends (`ProductAttributes` in the Merchant API). */
export interface GoogleProductAttributes {
  title: string;
  description: string;
  link: string;
  imageLink?: string;
  additionalImageLinks?: string[];
  availability: GoogleAvailability;
  condition: GoogleCondition;
  price: GooglePrice;
  salePrice?: GooglePrice;
  brand?: string;
  gtins?: string[];
  identifierExists?: boolean;
  itemGroupId?: string;
  color?: string;
  size?: string;
  shippingWeight?: { value: number; unit: string };
}

/** One offer: a variant in one country's language and feed label. */
export interface GoogleProductInput {
  offerId: string;
  contentLanguage: string;
  feedLabel: string;
  productAttributes: GoogleProductAttributes;
}
