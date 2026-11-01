import { generateSecureToken, hashSecret } from './secure-token.js';

describe('generateSecureToken', () => {
  it('returns a different URL-safe token every time', () => {
    const first = generateSecureToken(32);
    const second = generateSecureToken(32);

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[\w-]+$/);
  });
});

describe('hashSecret', () => {
  it('is deterministic and does not contain the secret', () => {
    const digest = hashSecret('cm_secret');

    expect(digest).toBe(hashSecret('cm_secret'));
    expect(digest).not.toContain('cm_secret');
    expect(digest).toHaveLength(64);
  });
});
