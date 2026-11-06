import { requestToken } from './request-token.js';

describe('requestToken', () => {
  it('reads a bearer token, then the x-api-key header', () => {
    expect(requestToken({ authorization: 'Bearer cm_secret' })).toBe('cm_secret');
    expect(requestToken({ 'x-api-key': 'cm_other' })).toBe('cm_other');
  });

  it('finds none in other schemes or empty values', () => {
    expect(requestToken({ authorization: 'Basic abc' })).toBeUndefined();
    expect(requestToken({ authorization: 'Bearer ' })).toBeUndefined();
    expect(requestToken({})).toBeUndefined();
  });
});
