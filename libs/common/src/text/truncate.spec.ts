import { truncate } from './truncate.js';

describe('truncate', () => {
  it('keeps text within the limit as it is', () => {
    expect(truncate('Mug', 3)).toBe('Mug');
    expect(truncate('', 0)).toBe('');
  });

  it('cuts longer text to the limit', () => {
    expect(truncate('Stoneware mug', 9)).toBe('Stoneware');
    expect(truncate('Mug', 0)).toBe('');
  });

  it('counts an emoji as one character and never splits it', () => {
    expect(truncate('Mug ☕🍵 set', 5)).toBe('Mug ☕');
    expect(truncate('🍵🍵🍵', 2)).toBe('🍵🍵');
    expect(truncate('🍵🍵🍵', 2)).not.toMatch(/[\uD800-\uDBFF]$/);
  });
});
