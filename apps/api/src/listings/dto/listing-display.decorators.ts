import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PublishRequirement } from '@crossmart/connectors';
import { ListingDisplayState } from '@crossmart/core';
import { PUBLISH_REQUIREMENT_SCHEMA_NAME } from '../../channels/channels.constants.js';
import { LISTING_DISPLAY_STATE_SCHEMA_NAME } from '../listings.constants.js';

/** `displayState`: the one state a merchant reads for a product on a store. */
export function DisplayStateProperty(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      enum: ListingDisplayState,
      enumName: LISTING_DISPLAY_STATE_SCHEMA_NAME,
      description:
        'The product on this store, in one state computed by the server: `draft` (not selected ' +
        'for the store), `needs_details` (selected, but the store setup or the product lacks ' +
        'something publishing needs), `ready` (publishable, not sent yet), `publishing` (queued ' +
        'or in flight, including an update of a published listing that a sync or retry queued), ' +
        '`published`, `failed`, `removing` (being taken off) or `removed`.',
    }),
  );
}

/** `displayReason`: why, for the states that need a reason. */
export function DisplayReasonProperty(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      type: String,
      nullable: true,
      example: 'Choose a shipping policy in this eBay connection’s listing defaults.',
      description:
        'For `needs_details` and `failed`: a short, merchant-readable reason (what to add, or ' +
        'the channel’s message). Never holds secrets. Null for the other states.',
    }),
  );
}

/** `displayRequirement`: what to fix first, for `needs_details`. */
export function DisplayRequirementProperty(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      enum: PublishRequirement,
      enumName: PUBLISH_REQUIREMENT_SCHEMA_NAME,
      nullable: true,
      description:
        'For `needs_details`: the requirement to fix first, so a client can open the right ' +
        'place. Store-setup requirements (`reconnect`, `account_settings`, `shipping_policy`, ' +
        '`payment_policy`, `return_policy`, `ship_from_location`, `listing_setup`) come before ' +
        'the product’s (`images`, `active_product`, `option_names`), which the server checks ' +
        'before publishing; `category` and `item_specifics` are known once the channel refused ' +
        'a publish. Null for the other states.',
    }),
  );
}
