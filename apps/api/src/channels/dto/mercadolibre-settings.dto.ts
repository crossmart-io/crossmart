import { ApiProperty } from '@nestjs/swagger';
import { type MercadoLibreSettings, MercadoLibreSiteId } from '@crossmart/connectors';
import { MERCADOLIBRE_SITE_ID_SCHEMA_NAME } from '../channels.constants.js';

/** What Crossmart read about the Mercado Libre seller on connect. */
export class MercadoLibreSettingsDto {
  @ApiProperty({ example: '1008002397', description: 'The seller’s Mercado Libre user id' })
  userId: string;

  @ApiProperty({ example: 'TESTSELLER' })
  nickname: string;

  @ApiProperty({
    enum: MercadoLibreSiteId,
    enumName: MERCADOLIBRE_SITE_ID_SCHEMA_NAME,
    description: 'The country site the seller sells on',
  })
  siteId: MercadoLibreSiteId;

  @ApiProperty({ example: 'MXN', description: 'ISO 4217 code of the site’s currency' })
  currencyCode: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'http://perfil.mercadolibre.com.mx/TESTSELLER',
  })
  permalink: string | null;

  @ApiProperty({
    description:
      'Whether the seller lists under User Products: one item per variant, each with its own price',
  })
  userProductSeller: boolean;

  static from(settings: MercadoLibreSettings): MercadoLibreSettingsDto {
    return Object.assign(new MercadoLibreSettingsDto(), {
      userId: settings.userId,
      nickname: settings.nickname,
      siteId: settings.siteId,
      currencyCode: settings.currencyCode,
      permalink: settings.permalink,
      userProductSeller: settings.userProductSeller,
    });
  }
}
