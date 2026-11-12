import { ApiProperty } from '@nestjs/swagger';
import { FalabellaCountry, type FalabellaSettings } from '@crossmart/connectors';
import { FALABELLA_COUNTRY_SCHEMA_NAME } from '../channels.constants.js';

/** The Falabella account: its country, seller and Seller Center user. The API key is not here. */
export class FalabellaSettingsDto {
  @ApiProperty({ enum: FalabellaCountry, enumName: FALABELLA_COUNTRY_SCHEMA_NAME })
  country: FalabellaCountry;

  @ApiProperty({ example: 'SC478FA' })
  sellerId: string;

  @ApiProperty({
    example: 'seller@example.com',
    description: 'The Seller Center user whose key is used',
  })
  userId: string;

  @ApiProperty({ example: 'CLP', description: 'ISO 4217 code of the country’s currency' })
  currencyCode: string;

  static from(settings: FalabellaSettings): FalabellaSettingsDto {
    const { channel: _channel, ...fields } = settings;
    return Object.assign(new FalabellaSettingsDto(), fields);
  }
}
