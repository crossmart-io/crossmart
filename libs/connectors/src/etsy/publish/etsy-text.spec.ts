import { etsyMaterials, etsyPropertyValue, etsyTags, etsyTitle } from './etsy-text.js';

describe('etsyTitle', () => {
  it('drops characters Etsy refuses and repeats of % : & +', () => {
    expect(etsyTitle('Mug <Blue> 100% & 50% off: big & bold + more + less ★ 🎁')).toBe(
      'Mug <Blue> 100% & 50 off: big bold + more less',
    );
  });

  it('keeps at most 140 characters', () => {
    expect(etsyTitle('a'.repeat(200))).toHaveLength(140);
  });
});

describe('etsyTags', () => {
  it('keeps 13 tags Etsy accepts, of at most 20 characters, without repeats', () => {
    const tags = etsyTags([
      'Handmade mug!',
      '-coffee',
      "'tea",
      'handmade MUG',
      'a very long tag that goes on and on',
      '',
      '***',
      ...Array.from({ length: 20 }, (_, index) => `tag ${index}`),
    ]);

    expect(tags.slice(0, 4)).toEqual(['Handmade mug', 'coffee', 'tea', 'a very long tag that']);
    expect(tags).toHaveLength(13);
    expect(tags.every((tag) => tag.length <= 20)).toBe(true);
  });
});

describe('etsyMaterials and etsyPropertyValue', () => {
  it('keep only what Etsy accepts', () => {
    expect(etsyMaterials(['Stoneware, glazed', 'stoneware glazed', 'Clay'])).toEqual([
      'Stoneware glazed',
      'Clay',
    ]);
    expect(etsyPropertyValue('Large (12 oz)')).toBe('Large 12 oz');
  });
});
