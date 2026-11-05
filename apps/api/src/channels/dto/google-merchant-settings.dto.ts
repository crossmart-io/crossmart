import { ApiProperty } from '@nestjs/swagger';
import {
  type GoogleListingSetup,
  type GoogleMerchantSettings,
  GoogleTargetCountry,
} from '@crossmart/connectors';
import { GOOGLE_TARGET_COUNTRY_SCHEMA_NAME } from '../channels.constants.js';

/** Where the connection's listings go, as the merchant saved it. */
export class GoogleListingSetupDto {
  @ApiProperty({ enum: GoogleTargetCountry, enumName: GOOGLE_TARGET_COUNTRY_SCHEMA_NAME })
  country: GoogleTargetCountry;

  @ApiProperty({ example: 'https://acme.example/products/{handle}' })
  productUrlTemplate: string;

  @ApiProperty({ description: 'The Merchant Center API data source Crossmart publishes into' })
  dataSourceId: string;

  static from(setup: GoogleListingSetup): GoogleListingSetupDto {
    return Object.assign(new GoogleListingSetupDto(), setup);
  }
}

/** What Crossmart read from the Merchant Center account, and its listing setup. */
export class GoogleMerchantSettingsDto {
  @ApiProperty({ example: '123456789' })
  accountId: string;

  @ApiProperty({ example: 'Acme Goods' })
  accountName: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The website the account claimed; product links must be on it',
  })
  homepageUri: string | null;

  @ApiProperty({ description: 'Whether the account verified and claimed its website' })
  homepageClaimed: boolean;

  @ApiProperty({ enum: GoogleTargetCountry, enumName: GOOGLE_TARGET_COUNTRY_SCHEMA_NAME })
  country: GoogleTargetCountry;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 code of the country’s currency' })
  currencyCode: string;

  @ApiProperty({ example: 'en', description: 'The language listings are written in' })
  contentLanguage: string;

  @ApiProperty({
    type: GoogleListingSetupDto,
    nullable: true,
    description: 'Null until the merchant saves it; publishing needs it',
  })
  listingSetup: GoogleListingSetupDto | null;

  @ApiProperty({ description: 'Whether the listing setup is saved, so products can be listed' })
  readyToList: boolean;

  static from(settings: GoogleMerchantSettings): GoogleMerchantSettingsDto {
    const { channel: _channel, listingSetup, ...fields } = settings;
    return Object.assign(new GoogleMerchantSettingsDto(), {
      ...fields,
      listingSetup: listingSetup ? GoogleListingSetupDto.from(listingSetup) : null,
      readyToList: listingSetup !== undefined,
    });
  }
}
