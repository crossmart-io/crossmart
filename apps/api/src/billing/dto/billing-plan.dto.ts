import { ApiProperty } from '@nestjs/swagger';
import {
  type BillingPlan,
  type BillingPlanCatalog,
  Feature,
  FeatureKind,
  type FeatureGrant,
  type PlanPrice,
} from '@crossmart/core';
import { BillingInterval } from '@crossmart/database';
import {
  FEATURE_KIND_SCHEMA_NAME,
  FEATURE_SCHEMA_NAME,
} from '../../entitlements/entitlements.constants.js';
import { BILLING_INTERVAL_SCHEMA_NAME } from '../billing.constants.js';

export class PlanPriceDto {
  @ApiProperty({ enum: BillingInterval, enumName: BILLING_INTERVAL_SCHEMA_NAME })
  interval: BillingInterval;

  @ApiProperty({ example: 27600, description: 'Each charge, in the currency’s minor unit (cents)' })
  amount: number;

  @ApiProperty({
    example: 2300,
    description:
      'The charge spread over the months it covers, in minor units, to compare intervals',
  })
  monthlyAmount: number;

  @ApiProperty({ example: 'usd', description: 'Lower-case ISO 4217 code' })
  currency: string;

  static from(price: PlanPrice): PlanPriceDto {
    return Object.assign(new PlanPriceDto(), price);
  }
}

export class PlanGrantDto {
  @ApiProperty({ enum: Feature, enumName: FEATURE_SCHEMA_NAME })
  feature: Feature;

  @ApiProperty({ enum: FeatureKind, enumName: FEATURE_KIND_SCHEMA_NAME })
  kind: FeatureKind;

  @ApiProperty({ description: 'Whether the plan includes the feature' })
  enabled: boolean;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'How many the plan allows; null is unlimited, 0 is not included',
  })
  limit: number | null;

  static from(grant: FeatureGrant): PlanGrantDto {
    return Object.assign(new PlanGrantDto(), grant);
  }
}

export class BillingPlanDto {
  @ApiProperty({ example: 'growth' })
  code: string;

  @ApiProperty({ example: 'Growth' })
  name: string;

  @ApiProperty({ description: 'The plan version new subscriptions get' })
  version: number;

  @ApiProperty({ type: [PlanGrantDto], description: 'What the plan includes, every feature' })
  features: PlanGrantDto[];

  @ApiProperty({
    type: [PlanPriceDto],
    description: 'Monthly first; empty for a plan that is not sold online',
  })
  prices: PlanPriceDto[];

  @ApiProperty({ description: 'False for plans sold by contacting sales, such as Enterprise' })
  selfServe: boolean;

  static from(plan: BillingPlan): BillingPlanDto {
    return Object.assign(new BillingPlanDto(), {
      code: plan.code,
      name: plan.name,
      version: plan.version,
      features: [...plan.grants.values()].map((grant) => PlanGrantDto.from(grant)),
      prices: plan.prices.map((price) => PlanPriceDto.from(price)),
      selfServe: plan.selfServe,
    });
  }
}

export class BillingPlanCatalogDto {
  @ApiProperty({ type: [BillingPlanDto], description: 'The offered plans, in order' })
  plans: BillingPlanDto[];

  @ApiProperty({ example: 'hello@crossmart.io', description: 'Where to ask about other plans' })
  salesEmail: string;

  static from(catalog: BillingPlanCatalog): BillingPlanCatalogDto {
    return Object.assign(new BillingPlanCatalogDto(), {
      plans: catalog.plans.map((plan) => BillingPlanDto.from(plan)),
      salesEmail: catalog.salesEmail,
    });
  }
}
