import { findEnumValue, requireEnumValue } from './enum-value.js';

enum Fruit {
  Apple = 'apple',
  Pear = 'pear',
}

describe('enum values stored as text', () => {
  it('finds a known value and ignores an unknown one', () => {
    expect(findEnumValue(Fruit, 'pear')).toBe(Fruit.Pear);
    expect(findEnumValue(Fruit, 'plum')).toBeUndefined();
    expect(findEnumValue(Fruit, null)).toBeUndefined();
  });

  it('throws on a value that must be known', () => {
    expect(requireEnumValue(Fruit, 'apple')).toBe(Fruit.Apple);
    expect(() => requireEnumValue(Fruit, 'Apple')).toThrow('Unknown enum value');
  });
});
