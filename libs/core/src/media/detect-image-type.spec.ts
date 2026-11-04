import { detectImageType } from './detect-image-type.js';
import { ImageContentType } from './enums/image-content-type.enum.js';

const bytes = (...values: number[]): Buffer => Buffer.from(values);

describe('detectImageType', () => {
  it.each([
    [bytes(0xff, 0xd8, 0xff, 0xe0), ImageContentType.Jpeg],
    [bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00), ImageContentType.Png],
    [Buffer.from('GIF89a...'), ImageContentType.Gif],
    [Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 '), ImageContentType.Webp],
  ])('recognizes %#', (content, expected) => {
    expect(detectImageType(content)).toBe(expected);
  });

  it.each([
    ['an SVG', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>')],
    ['a RIFF that is not WebP', Buffer.from('RIFF\u0000\u0000\u0000\u0000WAVEfmt ')],
    ['an empty file', Buffer.alloc(0)],
  ])('rejects %s', (_label, content) => {
    expect(detectImageType(content)).toBeNull();
  });
});
