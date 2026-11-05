import { toGooglePrices, toMicros } from './google-price.js';

describe('toMicros', () => {
  it.each([
    ['12', '12000000'],
    ['12.5', '12500000'],
    ['0.99', '990000'],
    ['19.999999', '19999999'],
    ['1234567.89', '1234567890000'],
  ])('turns %s into %s micros without float rounding', (amount, micros) => {
    expect(toMicros(amount)).toBe(micros);
  });
});

describe('toGooglePrices', () => {
  it('uses a higher compare-at price as the regular price and the price as the sale', () => {
    expect(toGooglePrices({ price: '10', compareAtPrice: '12' }, 'USD')).toEqual({
      price: { amountMicros: '12000000', currencyCode: 'USD' },
      salePrice: { amountMicros: '10000000', currencyCode: 'USD' },
    });
    expect(toGooglePrices({ price: '10', compareAtPrice: '9' }, 'USD')).toEqual({
      price: { amountMicros: '10000000', currencyCode: 'USD' },
    });
  });
});
