import { constantTimeEquals, hmacSha256 } from './hmac.js';

describe('hmacSha256', () => {
  it('matches the RFC 4231 test vector', () => {
    const key = Buffer.alloc(20, 0x0b);

    expect(hmacSha256(key, 'Hi There', 'hex')).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    );
  });
});

describe('constantTimeEquals', () => {
  it('is true only for identical strings, whatever their lengths', () => {
    expect(constantTimeEquals('abc', 'abc')).toBe(true);
    expect(constantTimeEquals('abc', 'abd')).toBe(false);
    expect(constantTimeEquals('abc', 'abcd')).toBe(false);
    expect(constantTimeEquals('', '')).toBe(true);
  });
});
