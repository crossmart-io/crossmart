import { inflateSync } from 'node:zlib';
import { swatchPng } from './swatch-png.js';

const PNG_SIGNATURE_HEX = '89504e470d0a1a0a';
const SIGNATURE_BYTES = 8;
const WIDTH_OFFSET = 16;
const IDAT_DATA_OFFSET = 41;
const SIZE = 4;

describe('swatchPng', () => {
  it('writes a PNG of the requested size in the requested colour', () => {
    const png = swatchPng('#1a4be0', SIZE);

    expect(png.subarray(0, SIGNATURE_BYTES).toString('hex')).toBe(PNG_SIGNATURE_HEX);
    expect(png.readUInt32BE(WIDTH_OFFSET)).toBe(SIZE);

    const idatLength = png.readUInt32BE(IDAT_DATA_OFFSET - SIGNATURE_BYTES);
    const pixels = inflateSync(png.subarray(IDAT_DATA_OFFSET, IDAT_DATA_OFFSET + idatLength));
    // Each row starts with a filter byte, then the first pixel's red, green and blue.
    expect([...pixels.subarray(1, 4)]).toEqual([0x1a, 0x4b, 0xe0]);
  });
});
