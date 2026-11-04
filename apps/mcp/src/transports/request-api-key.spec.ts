import { requestApiKey } from './request-api-key.js';

describe('requestApiKey', () => {
  it('reads a bearer token, then the x-api-key header', () => {
    expect(requestApiKey({ authorization: 'Bearer cm_secret' })).toBe('cm_secret');
    expect(requestApiKey({ 'x-api-key': 'cm_other' })).toBe('cm_other');
  });

  it('finds none in other schemes or empty values', () => {
    expect(requestApiKey({ authorization: 'Basic abc' })).toBeUndefined();
    expect(requestApiKey({ authorization: 'Bearer ' })).toBeUndefined();
    expect(requestApiKey({})).toBeUndefined();
  });
});
