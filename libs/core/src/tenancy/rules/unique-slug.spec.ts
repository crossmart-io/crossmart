import { uniqueSlug } from './unique-slug.js';

describe('uniqueSlug', () => {
  it('slugifies the name and numbers it when taken', () => {
    expect(uniqueSlug('EU Store', [])).toBe('eu-store');
    expect(uniqueSlug('EU Store', ['eu-store', 'eu-store-2'])).toBe('eu-store-3');
  });

  it('falls back when the name has nothing to slug', () => {
    expect(uniqueSlug('★★★', [])).toBe('workspace');
  });
});
