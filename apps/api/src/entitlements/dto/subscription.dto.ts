import { ApiProperty } from '@nestjs/swagger';
import {
  Feature,
  FeatureKind,
  type FeatureUsage,
  type PlanReference,
  type SubscriptionOverview,
} from '@crossmart/core';
import { SubscriptionStatus } from '@crossmart/database';
import {
  FEATURE_KIND_SCHEMA_NAME,
  FEATURE_SCHEMA_NAME,
  SUBSCRIPTION_STATUS_SCHEMA_NAME,
} from '../entitlements.constants.js';

export class PlanDto {
  @ApiProperty({ example: 'growth', description: 'Stable identifier of the plan' })
  code: string;

  @ApiProperty({ example: 'Growth' })
  name: string;

  @ApiProperty({
    example: 1,
    description: 'The plan version the organization is on; later versions never change it',
  })
  version: number;

  static from(plan: PlanReference): PlanDto {
    return Object.assign(new PlanDto(), plan);
  }
}

export class FeatureUsageDto {
  @ApiProperty({ enum: Feature, enumName: FEATURE_SCHEMA_NAME })
  feature: Feature;

  @ApiProperty({
    enum: FeatureKind,
    enumName: FEATURE_KIND_SCHEMA_NAME,
    description: 'A counted limit, or a flag the plan turns on or off',
  })
  kind: FeatureKind;

  @ApiProperty({ description: 'Whether the plan includes the feature at all' })
  enabled: boolean;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'How many the plan allows; null is unlimited, 0 is not included',
  })
  limit: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'How many are in use now, across the organization; null for flags',
  })
  usage: number | null;

  static from(usage: FeatureUsage): FeatureUsageDto {
    const { feature, kind, enabled, limit } = usage;
    return Object.assign(new FeatureUsageDto(), {
      feature,
      kind,
      enabled,
      limit,
      usage: usage.usage,
    });
  }
}

export class SubscriptionDto {
  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty({ type: PlanDto })
  plan: PlanDto;

  @ApiProperty({ enum: SubscriptionStatus, enumName: SUBSCRIPTION_STATUS_SCHEMA_NAME })
  status: SubscriptionStatus;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the paid period ends; null until billing is connected',
  })
  currentPeriodEnd: Date | null;

  @ApiProperty({
    description: 'Whether limits block actions here (402), or are only reported',
  })
  enforced: boolean;

  @ApiProperty({
    type: [FeatureUsageDto],
    description: 'Every feature, with what the plan allows and what is in use',
  })
  features: FeatureUsageDto[];

  static from(overview: SubscriptionOverview): SubscriptionDto {
    return Object.assign(new SubscriptionDto(), {
      organizationId: overview.organizationId,
      plan: PlanDto.from(overview.plan),
      status: overview.status,
      currentPeriodEnd: overview.currentPeriodEnd,
      enforced: overview.enforced,
      features: overview.features.map((feature) => FeatureUsageDto.from(feature)),
    });
  }
}
