/** What a business policy applies to; Crossmart does not list motor vehicles. */
export enum EbayPolicyCategoryType {
  AllExcludingMotorsVehicles = 'ALL_EXCLUDING_MOTORS_VEHICLES',
}

/** The unit of a policy's handling time or return period. */
export enum EbayTimeDurationUnit {
  Day = 'DAY',
}

/** Whether a shipping option's services ship within the country or abroad. */
export enum EbayShippingOptionType {
  Domestic = 'DOMESTIC',
}

/** How a shipping option is priced: one rate for every buyer. */
export enum EbayShippingCostType {
  FlatRate = 'FLAT_RATE',
}

/** Who pays to ship a returned item back to the seller. */
export enum EbayReturnShippingCostPayer {
  Buyer = 'BUYER',
}
