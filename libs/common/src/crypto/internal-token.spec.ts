import { InternalToken } from './internal-token.js';

const OPTIONS = {
  secret: 'server-secret',
  keyContext: 'crossmart:test:v1',
  issuer: 'crossmart-api',
  audience: 'crossmart:test',
  ttlSeconds: 60,
};

describe('InternalToken', () => {
  it('carries its subject and claims', async () => {
    const token = new InternalToken(OPTIONS);
    const verified = await token.verify(await token.issue('u-1', { wid: 'ws-1' }));
    expect(verified?.subject).toBe('u-1');
    expect(verified?.claims.wid).toBe('ws-1');
  });

  it('is good only for its own purpose', async () => {
    const token = new InternalToken(OPTIONS);
    const otherPurpose = new InternalToken({ ...OPTIONS, keyContext: 'crossmart:other:v1' });
    const otherAudience = new InternalToken({ ...OPTIONS, audience: 'crossmart:other' });
    expect(await token.verify(await otherPurpose.issue('u-1', {}))).toBeNull();
    expect(await token.verify(await otherAudience.issue('u-1', {}))).toBeNull();
  });
});
