import { ApiProperty } from '@nestjs/swagger';
import type { BillingStatus } from '@crossmart/core';
import { BillingInterval, SubscriptionStatus } from '@crossmart/database';
import { PlanDto } from '../../entitlements/dto/subscription.dto.js';
import { SUBSCRIPTION_STATUS_SCHEMA_NAME } from '../../entitlements/entitlements.constants.js';
import { BILLING_INTERVAL_SCHEMA_NAME } from '../billing.constants.js';
import { SubscriptionAccessDto } from './subscription-access.dto.js';

/** An organization's subscription as its billing page shows it. */
export class BillingStatusDto {
  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty({
    description:
      'Whether this instance bills customers; false when self-hosting, where all is free',
  })
  enabled: boolean;

  @ApiProperty({ type: PlanDto })
  plan: PlanDto;

  @ApiProperty({
    enum: SubscriptionStatus,
    enumName: SUBSCRIPTION_STATUS_SCHEMA_NAME,
    description:
      '`INCOMPLETE` until a plan is chosen; `ACTIVE` with no billing account is an organization ' +
      'from before billing',
  })
  status: SubscriptionStatus;

  @ApiProperty({
    enum: BillingInterval,
    enumName: BILLING_INTERVAL_SCHEMA_NAME,
    nullable: true,
    description: 'How often the subscription renews; null before one starts',
  })
  interval: BillingInterval | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the subscription renews, or ends when `cancelAtPeriodEnd` is true',
  })
  currentPeriodEnd: Date | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the trial ends (the card is charged then), or ended',
  })
  trialEnd: Date | null;

  @ApiProperty({ description: 'The subscription ends at `currentPeriodEnd` instead of renewing' })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ type: SubscriptionAccessDto })
  access: SubscriptionAccessDto;

  @ApiProperty({ description: 'Whether the billing portal can open (a plan was chosen before)' })
  hasBillingAccount: boolean;

  @ApiProperty({ description: 'Whether choosing a plan now starts with a free trial' })
  trialAvailable: boolean;

  static from(status: BillingStatus): BillingStatusDto {
    const { access, enforced, plan, ...rest } = status;
    return Object.assign(new BillingStatusDto(), {
      ...rest,
      plan: PlanDto.from(plan),
      access: SubscriptionAccessDto.from(access, enforced),
    });
  }
}
