import { SandboxRestriction } from '../enums/sandbox-restriction.enum.js';
import { sandboxRefusalMessage } from './sandbox-message.js';

const CLAIM_EXPIRES_AT = new Date('2026-11-21T10:00:00.000Z');

describe('sandboxRefusalMessage', () => {
  it('says what the sandbox cannot do and that the user must claim it first', () => {
    expect(
      sandboxRefusalMessage({
        restriction: SandboxRestriction.ConnectChannel,
        claimExpiresAt: CLAIM_EXPIRES_AT,
      }),
    ).toBe(
      'This Crossmart account is an unclaimed sandbox, so it cannot connect a store. Ask the ' +
        'user to claim it with the link Crossmart emailed them (it works until 2026-11-21). ' +
        'Once claimed, you can connect a store.',
    );
  });

  it('states the product cap and how many products there are', () => {
    const message = sandboxRefusalMessage({
      restriction: SandboxRestriction.AddProducts,
      claimExpiresAt: CLAIM_EXPIRES_AT,
      productCount: 100,
    });
    expect(message).toContain('holds at most 100 products (100 now)');
    expect(message).toContain('Once claimed, you can add more products.');
  });
});
