<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * For `needs_details`: the requirement to fix first, so a client can open the right place. Store-setup requirements (`reconnect`, `account_settings`, `shipping_policy`, `payment_policy`, `return_policy`, `ship_from_location`, `listing_setup`) come before the product’s (`images`, `active_product`, `option_names`), which the server checks before publishing; `category` and `item_specifics` are known once the channel refused a publish. Null for the other states.
 */
enum PublishRequirement: string
{
    case Reconnect = 'reconnect';
    case AccountSettings = 'account_settings';
    case ShippingPolicy = 'shipping_policy';
    case PaymentPolicy = 'payment_policy';
    case ReturnPolicy = 'return_policy';
    case ShipFromLocation = 'ship_from_location';
    case ListingSetup = 'listing_setup';
    case ItemDetails = 'item_details';
    case ShippingProfile = 'shipping_profile';
    case ProcessingProfile = 'processing_profile';
    case Images = 'images';
    case ActiveProduct = 'active_product';
    case Category = 'category';
    case ItemSpecifics = 'item_specifics';
    case OptionNames = 'option_names';
}
