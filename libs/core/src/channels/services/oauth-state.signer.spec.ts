import type { AppConfigService } from '@crossmart/common';
import { ChannelType } from '@crossmart/connectors';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import { OAuthStateSigner } from './oauth-state.signer.js';

const NOW = new Date('2026-11-03T10:00:00Z');
const CLAIMS = {
  workspaceId: '0b6c1d4e-7f0a-4c55-9a39-3c1f4b7e9d01',
  userId: '5a0e7c3b-2d1f-4e8a-b6c9-8f7e6d5c4b3a',
  channel: ChannelType.Shopify,
  externalAccountId: 'demo-store.myshopify.com',
};

function signer(secret = 'a-test-auth-secret-of-at-least-32-chars'): OAuthStateSigner {
  return new OAuthStateSigner({ authSecret: secret } as AppConfigService);
}

function failureOf(action: () => unknown): ConnectFailure | undefined {
  try {
    action();
  } catch (error) {
    return (error as { failure?: ConnectFailure }).failure;
  }
  return undefined;
}

describe('OAuthStateSigner', () => {
  it('round-trips the claims with a fresh nonce each time', () => {
    const states = signer();
    const first = states.sign(CLAIMS, NOW);

    expect(states.verify(first, NOW)).toMatchObject({
      ...CLAIMS,
      expiresAt: NOW.getTime() + 600_000,
    });
    expect(states.sign(CLAIMS, NOW)).not.toBe(first);
  });

  it('rejects a state once it has expired', () => {
    const states = signer();
    const state = states.sign(CLAIMS, NOW);
    const later = new Date(NOW.getTime() + 600_000);

    expect(failureOf(() => states.verify(state, later))).toBe(ConnectFailure.ExpiredState);
  });

  it('rejects forged, tampered, foreign-signed and missing states', () => {
    const states = signer();
    const state = states.sign(CLAIMS, NOW);
    const [payload, signature] = state.split('.');
    const tampered = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(payload, 'base64url').toString()),
        workspaceId: CLAIMS.userId,
      }),
    ).toString('base64url');

    for (const candidate of [
      `${tampered}.${signature}`,
      signer('another-auth-secret-of-at-least-32-chars').sign(CLAIMS, NOW),
      'garbage',
      `${payload}.`,
      undefined,
    ]) {
      expect(failureOf(() => states.verify(candidate, NOW))).toBe(ConnectFailure.InvalidState);
    }
  });
});
