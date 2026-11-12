import { ApiProperty } from '@nestjs/swagger';
import {
  FALABELLA_CREDENTIALS_GUIDE_URL,
  FalabellaCountry,
  type FalabellaCredentialField,
} from '@crossmart/connectors';
import { FALABELLA_COUNTRY_SCHEMA_NAME } from '../channels.constants.js';

/**
 * What a Falabella seller pastes to connect. Documents the `credentials` of
 * `ConnectWithCredentialsDto`; the connector checks the values.
 */
export class FalabellaCredentialsDto implements Record<FalabellaCredentialField, string> {
  @ApiProperty({
    example: 'SC478FA',
    description: 'The seller id, under Mi cuenta in Seller Center',
  })
  sellerId: string;

  @ApiProperty({
    example: 'seller@example.com',
    description: `The Seller Center user’s email (Mi cuenta, Usuarios). See ${FALABELLA_CREDENTIALS_GUIDE_URL}`,
  })
  userId: string;

  @ApiProperty({
    writeOnly: true,
    description:
      'The user’s API key, from the Api Key column of Mi cuenta, Usuarios. Stored encrypted; never returned.',
  })
  apiKey: string;

  @ApiProperty({
    enum: FalabellaCountry,
    enumName: FALABELLA_COUNTRY_SCHEMA_NAME,
    description: 'The country the account sells in: facl Chile, faco Colombia, fape Peru',
  })
  country: FalabellaCountry;
}
