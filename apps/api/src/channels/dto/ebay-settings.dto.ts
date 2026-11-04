import { ApiProperty } from '@nestjs/swagger';
import {
  type EbayBusinessPolicies,
  EbayMarketplaceId,
  type EbayPolicy,
  type EbaySettings,
} from '@crossmart/connectors';
import { EBAY_MARKETPLACE_ID_SCHEMA_NAME } from '../channels.constants.js';

export class EbayPolicyDto implements EbayPolicy {
  @ApiProperty({ example: '6000000001' })
  id: string;

  @ApiProperty({ example: 'Free shipping' })
  name: string;
}

/** The seller's business policies on the marketplace, as eBay listed them on connect. */
export class EbayBusinessPoliciesDto implements EbayBusinessPolicies {
  @ApiProperty({ type: [EbayPolicyDto] })
  fulfillment: EbayPolicyDto[];

  @ApiProperty({ type: [EbayPolicyDto] })
  payment: EbayPolicyDto[];

  @ApiProperty({ type: [EbayPolicyDto] })
  return: EbayPolicyDto[];

  static from(policies: EbayBusinessPolicies): EbayBusinessPoliciesDto {
    const toDtos = (list: EbayPolicy[]): EbayPolicyDto[] =>
      list.map((policy) => Object.assign(new EbayPolicyDto(), policy));
    return Object.assign(new EbayBusinessPoliciesDto(), {
      fulfillment: toDtos(policies.fulfillment),
      payment: toDtos(policies.payment),
      return: toDtos(policies.return),
    });
  }
}

/** What Crossmart read from the eBay account on the connection's marketplace. */
export class EbaySettingsDto {
  @ApiProperty({ enum: EbayMarketplaceId, enumName: EBAY_MARKETPLACE_ID_SCHEMA_NAME })
  marketplaceId: EbayMarketplaceId;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 code of the marketplace’s currency' })
  currencyCode: string;

  @ApiProperty({ example: 'demo_seller' })
  username: string;

  @ApiProperty({ description: 'eBay’s immutable id of the user' })
  userId: string;

  @ApiProperty({
    description: 'False when the account has not opted in to business policies on eBay',
  })
  businessPoliciesEnabled: boolean;

  @ApiProperty({ type: EbayBusinessPoliciesDto })
  policies: EbayBusinessPoliciesDto;

  static from(settings: EbaySettings): EbaySettingsDto {
    const { channel: _channel, policies, ...fields } = settings;
    return Object.assign(new EbaySettingsDto(), {
      ...fields,
      policies: EbayBusinessPoliciesDto.from(policies),
    });
  }
}
