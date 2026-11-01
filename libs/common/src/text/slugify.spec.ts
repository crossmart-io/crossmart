import { slugify } from './slugify.js';

describe('slugify', () => {
  it.each([
    ["Joe's Store!", 'joe-s-store'],
    ['  Café  Crème ', 'cafe-creme'],
    ['Default', 'default'],
    ['---', ''],
  ])('turns %j into %j', (text, expected) => {
    expect(slugify(text)).toBe(expected);
  });
});
