import { ASK_REDACTED } from '../ask.constants.js';
import { redactSecrets } from './redact-secrets.js';

describe('redactSecrets', () => {
  it.each([
    ['a Crossmart API key', 'my key is cm_AbCdEf0123456789xyzXYZ_-abc, why 401?'],
    ['a Crossmart live key', 'cm_live_0123456789abcdefABCDEF'],
    ['a Stripe secret key', 'sk_live_51HxYzABCDEFGHIJKLMNOP'],
    ['a Stripe restricted key', 'rk_test_51HxYzABCDEFGHIJKLMNOP'],
    ['a webhook signing secret', 'whsec_c2VjcmV0LXNpZ25pbmcta2V5'],
    ['an Anthropic key', 'sk-ant-api03-AbCdEfGhIjKlMnOp'],
    ['a JSON web token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3OCJ9.c2lnbmF0dXJlLXZhbHVl'],
    ['an email address', 'write to jane.doe+shop@example.co.uk please'],
  ])('redacts %s', (_label, text) => {
    const redacted = redactSecrets(text);

    expect(redacted).toContain(ASK_REDACTED);
    expect(redacted).not.toMatch(/cm_\w{12}|sk[_-]\w{12}|rk_\w{12}|whsec_\w{12}|eyJ|@example/);
  });

  it('keeps ordinary questions as they are', () => {
    const question = 'How do I publish SKU-123 to eBay with the sk_ prefix explained?';

    expect(redactSecrets(question)).toBe(question);
  });
});
