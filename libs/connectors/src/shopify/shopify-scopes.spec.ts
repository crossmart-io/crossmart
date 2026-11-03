import { missingScopes, parseScopes } from './shopify-scopes.js';

describe('Shopify scopes', () => {
  it('parses the comma-separated scope Shopify returns', () => {
    expect(parseScopes('write_products, read_locations,')).toEqual([
      'write_products',
      'read_locations',
    ]);
  });

  it('treats a write scope as covering its read scope', () => {
    expect(missingScopes(['write_products'], ['read_products', 'write_products'])).toEqual([]);
    expect(missingScopes(['read_products'], ['read_products', 'write_products'])).toEqual([
      'write_products',
    ]);
    expect(missingScopes([], ['read_locations'])).toEqual(['read_locations']);
  });
});
