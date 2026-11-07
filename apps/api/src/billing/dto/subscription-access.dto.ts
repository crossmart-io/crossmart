import { ApiProperty } from '@nestjs/swagger';
import { type SubscriptionAccess, SubscriptionAccessState } from '@crossmart/core';
import { SUBSCRIPTION_ACCESS_STATE_SCHEMA_NAME } from '../../entitlements/entitlements.constants.js';

/** What an organization may do under its subscription, for banners and before writing. */
export class SubscriptionAccessDto {
  @ApiProperty({
    enum: SubscriptionAccessState,
    enumName: SUBSCRIPTION_ACCESS_STATE_SCHEMA_NAME,
    description:
      '`unrestricted` where billing is off; `trialing`, `active`, `past_due_grace`, `legacy` and ' +
      '`sandbox` keep full access; the others are read-only while billing is enforced',
  })
  state: SubscriptionAccessState;

  @ApiProperty({
    description:
      'False when the organization is read-only. Changes are refused (402 ' +
      '`subscription_inactive`) only while `enforced` is true',
  })
  writable: boolean;

  @ApiProperty({
    description: 'Whether a read-only organization is refused changes on this instance',
  })
  enforced: boolean;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description:
      'When the state ends on its own: the trial, the past-due grace period, or access for ' +
      'organizations from before billing. Null when it does not',
  })
  until: Date | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description:
      'When a scheduled cancellation ends a subscription that still has access (during a trial, ' +
      'the trial end, and nothing is charged). Null when it renews, or has no access to lose',
  })
  cancelAt: Date | null;

  static from(access: SubscriptionAccess, enforced: boolean): SubscriptionAccessDto {
    return Object.assign(new SubscriptionAccessDto(), { ...access, enforced });
  }
}
