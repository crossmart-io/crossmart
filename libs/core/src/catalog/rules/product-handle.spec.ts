import { defaultProductHandle } from './product-handle.js';

const FALLBACK_HANDLE = /^product-[0-9a-f]{12}$/;

describe('defaultProductHandle', () => {
  it('slugifies a title with Latin letters or digits', () => {
    expect(defaultProductHandle('Café Crème Mug')).toBe('cafe-creme-mug');
    expect(defaultProductHandle('צמיד 925')).toBe('925');
  });

  it.each(['צמיד כסף בעבודת יד', '手作りの銀のブレスレット', '!!!'])(
    'falls back to product-<id> for "%s"',
    (title) => {
      expect(defaultProductHandle(title)).toMatch(FALLBACK_HANDLE);
    },
  );

  it('gives each fallback its own id', () => {
    expect(defaultProductHandle('צמיד')).not.toBe(defaultProductHandle('צמיד'));
  });
});
