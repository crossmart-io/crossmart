import { PublishRequirement } from '@crossmart/connectors/sdk/publishing/publish-requirement.enum.js';
import { ListingDisplayState } from '@crossmart/core/listings/enums/listing-display-state.enum.js';

const MERCHANT_SETUP_STEP =
  'store setup only the merchant can finish in the Crossmart dashboard; tell them, then retry';
const FIX_PRODUCT_STEP = 'fix the product with get_product and replace_product, then retry';

/** What an agent does next for each requirement publishing can lack. */
export const REQUIREMENT_NEXT_STEPS: Readonly<Record<PublishRequirement, string>> = {
  [PublishRequirement.Reconnect]: 'the merchant connects the store again in the dashboard',
  [PublishRequirement.AccountSettings]: 'the merchant connects the store again in the dashboard',
  [PublishRequirement.ShippingPolicy]: MERCHANT_SETUP_STEP,
  [PublishRequirement.PaymentPolicy]: MERCHANT_SETUP_STEP,
  [PublishRequirement.ReturnPolicy]: MERCHANT_SETUP_STEP,
  [PublishRequirement.ShipFromLocation]: MERCHANT_SETUP_STEP,
  [PublishRequirement.ListingSetup]: MERCHANT_SETUP_STEP,
  [PublishRequirement.Images]: FIX_PRODUCT_STEP,
  [PublishRequirement.ActiveProduct]: FIX_PRODUCT_STEP,
  [PublishRequirement.OptionNames]: FIX_PRODUCT_STEP,
  [PublishRequirement.Category]:
    'pick one with suggest_store_categories and set_store_category, then retry',
  [PublishRequirement.ItemSpecifics]:
    'read get_item_specifics and fill every required aspect with save_item_specifics, then retry',
};

function requirementSteps(): string {
  return Object.entries(REQUIREMENT_NEXT_STEPS)
    .map(([requirement, step]) => `${requirement}: ${step}`)
    .join('; ');
}

/**
 * How to read a listing's state and act on it, for tool descriptions. `displayRequirement`
 * is read first when the API gives it; until then `listing.missingRequirement` and
 * `displayReason` say what is missing.
 */
export const LISTING_STATE_GUIDE =
  `Each row has displayState and displayReason. On ${ListingDisplayState.NeedsDetails} or ` +
  `${ListingDisplayState.Failed}, find what is missing in displayRequirement (when present), ` +
  'else listing.missingRequirement, else displayReason, and act on it (' +
  `${requirementSteps()}). Retry with retry_store_listing. With no requirement, show the ` +
  'merchant displayReason (the channel’s own message).';
