import { encodeParams } from './form-encoding.js';

describe('encodeParams', () => {
  it('percent-encodes keys and values, with %20 for spaces', () => {
    expect(encodeParams({ scope: 'a b', 'redirect uri': 'x+y&z=1' })).toBe(
      'scope=a%20b&redirect%20uri=x%2By%26z%3D1',
    );
    expect(new URLSearchParams(encodeParams({ scope: 'a b' })).get('scope')).toBe('a b');
  });
});
