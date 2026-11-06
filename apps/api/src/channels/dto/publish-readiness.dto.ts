import { ApiProperty } from '@nestjs/swagger';
import { PublishRequirement } from '@crossmart/connectors';
import type { PublishReadiness } from '@crossmart/core';
import { PUBLISH_REQUIREMENT_SCHEMA_NAME } from '../channels.constants.js';

/** Whether the store can publish listings, and what its setup lacks when it cannot. */
export class PublishReadinessDto {
  @ApiProperty({ description: 'True when listings can be published to this store' })
  ready: boolean;

  @ApiProperty({
    enum: PublishRequirement,
    enumName: PUBLISH_REQUIREMENT_SCHEMA_NAME,
    isArray: true,
    example: [PublishRequirement.ShippingPolicy, PublishRequirement.ShipFromLocation],
    description:
      'What to finish before publishing, in order; empty when ready. `reconnect` alone when ' +
      'the store needs to be connected again. eBay: `shipping_policy`, `payment_policy`, ' +
      '`return_policy`, `ship_from_location`. Google: `listing_setup`. Etsy: `item_details`, ' +
      '`shipping_profile`, `processing_profile`. `account_settings` when ' +
      'the account was never read.',
  })
  missing: PublishRequirement[];

  static from(readiness: PublishReadiness): PublishReadinessDto {
    return Object.assign(new PublishReadinessDto(), {
      ready: readiness.ready,
      missing: readiness.unmet.map((unmet) => unmet.requirement),
    });
  }
}
