import { readCookie } from './cookies.js';

describe('readCookie', () => {
  it('finds a cookie among others and decodes it', () => {
    expect(readCookie('a=1; nonce=x%2Dy; b=2', 'nonce')).toBe('x-y');
  });

  it('is null when the cookie, the header or a valid value is missing', () => {
    expect(readCookie('a=1; nonces=2', 'nonce')).toBeNull();
    expect(readCookie(undefined, 'nonce')).toBeNull();
    expect(readCookie('nonce=%E0%A4%A', 'nonce')).toBeNull();
  });
});
