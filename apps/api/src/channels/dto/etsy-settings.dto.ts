import { ApiProperty } from '@nestjs/swagger';
import {
  type EtsyListingSetup,
  type EtsyProfile,
  type EtsySettings,
  type EtsyShopProfiles,
  EtsyWhenMade,
  EtsyWhoMade,
  isCompleteListingSetup,
  resolveListingSetup,
} from '@crossmart/connectors';
import { ETSY_WHEN_MADE_SCHEMA_NAME, ETSY_WHO_MADE_SCHEMA_NAME } from '../channels.constants.js';

export class EtsyProfileDto implements EtsyProfile {
  @ApiProperty({ example: '6722757781' })
  id: string;

  @ApiProperty({ example: 'Free US shipping' })
  name: string;
}

/** The shop's shipping and processing profiles, as Etsy listed them on connect or refresh. */
export class EtsyShopProfilesDto implements EtsyShopProfiles {
  @ApiProperty({ type: [EtsyProfileDto] })
  shipping: EtsyProfileDto[];

  @ApiProperty({
    type: [EtsyProfileDto],
    description:
      'Processing profiles: whether items are ready to ship or made to order, and how long they take',
  })
  processing: EtsyProfileDto[];

  static from(profiles: EtsyShopProfiles): EtsyShopProfilesDto {
    const toDtos = (list: EtsyProfile[]): EtsyProfileDto[] =>
      list.map((profile) => Object.assign(new EtsyProfileDto(), profile));
    return Object.assign(new EtsyShopProfilesDto(), {
      shipping: toDtos(profiles.shipping),
      processing: toDtos(profiles.processing),
    });
  }
}

/** What every listing on the connection is published with, resolved against the shop's profiles. */
export class EtsyListingSetupDto implements EtsyListingSetup {
  @ApiProperty({ enum: EtsyWhoMade, enumName: ETSY_WHO_MADE_SCHEMA_NAME })
  whoMade: EtsyWhoMade;

  @ApiProperty({ enum: EtsyWhenMade, enumName: ETSY_WHEN_MADE_SCHEMA_NAME })
  whenMade: EtsyWhenMade;

  @ApiProperty({
    description: 'Whether the items are craft supplies rather than finished products',
  })
  isSupply: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'The shipping profile listings use; null when the shop has none or several and none is chosen',
  })
  shippingProfileId: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'The processing profile listings use' })
  processingProfileId: string | null;

  static from(setup: EtsyListingSetup, profiles: EtsyShopProfiles): EtsyListingSetupDto {
    return Object.assign(new EtsyListingSetupDto(), resolveListingSetup(setup, profiles));
  }
}

/** What Crossmart read from the Etsy shop, and its listing setup. */
export class EtsySettingsDto {
  @ApiProperty({ example: '87654321' })
  shopId: string;

  @ApiProperty({ example: 'ClayAndKiln' })
  shopName: string;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 code of the shop’s currency' })
  currencyCode: string;

  @ApiProperty({ type: String, nullable: true, example: 'https://www.etsy.com/shop/ClayAndKiln' })
  shopUrl: string | null;

  @ApiProperty({ type: EtsyShopProfilesDto })
  profiles: EtsyShopProfilesDto;

  @ApiProperty({
    type: EtsyListingSetupDto,
    nullable: true,
    description: 'Null until the merchant saves it; publishing needs it',
  })
  listingSetup: EtsyListingSetupDto | null;

  @ApiProperty({ description: 'Whether the listing setup is complete, so products can be listed' })
  readyToList: boolean;

  static from(settings: EtsySettings): EtsySettingsDto {
    const { listingSetup, profiles } = settings;
    const resolved = listingSetup ? resolveListingSetup(listingSetup, profiles) : null;
    return Object.assign(new EtsySettingsDto(), {
      shopId: settings.shopId,
      shopName: settings.shopName,
      currencyCode: settings.currencyCode,
      shopUrl: settings.shopUrl,
      profiles: EtsyShopProfilesDto.from(profiles),
      listingSetup: listingSetup ? EtsyListingSetupDto.from(listingSetup, profiles) : null,
      readyToList: resolved !== null && isCompleteListingSetup(resolved),
    });
  }
}
