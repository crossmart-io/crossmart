import { HttpStatus } from '@nestjs/common';
import { EntitlementErrorCode } from '../enums/entitlement-error-code.enum.js';
import { FeatureKind } from '../enums/feature-kind.enum.js';
import { Feature } from '../enums/feature.enum.js';
import { limitReachedCheck, TEST_PLAN } from '../testing/entitlement.fixtures.js';
import { EntitlementExceededException } from './entitlement-exceeded.exception.js';

describe('EntitlementExceededException', () => {
  it('is a 402 with a message people can act on and a code clients can', () => {
    const exception = new EntitlementExceededException(
      limitReachedCheck(Feature.ChannelConnections, 2),
    );

    expect(exception.getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
    expect(exception.getResponse()).toEqual({
      statusCode: HttpStatus.PAYMENT_REQUIRED,
      error: 'Payment Required',
      code: EntitlementErrorCode.PlanLimitReached,
      message:
        'The Free plan includes 2 connected channels, and 2 are in use. Upgrade the plan to add more.',
      feature: Feature.ChannelConnections,
      plan: 'free',
      limit: 2,
      usage: 2,
      requested: 1,
    });
    expect(exception.message).toContain('The Free plan includes 2 connected channels');
  });

  it('reads in the singular, and says when a batch is what does not fit', () => {
    const one = new EntitlementExceededException(limitReachedCheck(Feature.Workspaces, 1));
    expect(one.message).toBe(
      'The Free plan includes 1 workspace, and 1 is in use. Upgrade the plan to add more.',
    );
    const batch = new EntitlementExceededException({
      ...limitReachedCheck(Feature.ActiveListings, 1000),
      usage: 990,
      requested: 25,
    });
    expect(batch.message).toBe(
      'The Free plan includes 1,000 active listings, and 990 are in use. Adding 25 more ' +
        'would go past it. Upgrade the plan to add more.',
    );
  });

  it('says a flag is not included', () => {
    const exception = new EntitlementExceededException({
      feature: Feature.AutonomousAgents,
      kind: FeatureKind.Flag,
      plan: TEST_PLAN,
      allowed: false,
      enabled: false,
      limit: 0,
      usage: 0,
      requested: 1,
    });
    expect(exception.getResponse()).toMatchObject({
      code: EntitlementErrorCode.FeatureNotIncluded,
      message: 'Autonomous agents are not included in the Free plan. Upgrade the plan to use them.',
    });
  });
});
