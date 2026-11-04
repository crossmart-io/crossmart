import { isShopDomain, normalizeShopDomain } from './shop-domain.js';

describe('normalizeShopDomain', () => {
  it.each([
    ['demo-store', 'demo-store.myshopify.com'],
    ['Demo-Store.myshopify.com', 'demo-store.myshopify.com'],
    ['  https://demo-store.myshopify.com/admin/products ', 'demo-store.myshopify.com'],
  ])('reads %s as %s', (input, expected) => {
    expect(normalizeShopDomain(input)).toBe(expected);
  });

  it.each([
    '',
    'my store',
    '-demo.myshopify.com',
    'demo.myshopify.com.attacker.example',
    'demo.example.com',
    'demo.myshopify.com@attacker.example',
    'https://attacker.example/demo.myshopify.com',
  ])('rejects %s', (input) => {
    expect(normalizeShopDomain(input)).toBeNull();
  });
});

describe('isShopDomain', () => {
  it('accepts only an anchored myshopify domain', () => {
    expect(isShopDomain('demo.myshopify.com')).toBe(true);
    expect(isShopDomain('demo.myshopify.com.evil')).toBe(false);
    expect(isShopDomain(`${'a'.repeat(300)}.myshopify.com`)).toBe(false);
  });
});
