import { crc32, deflateSync } from 'node:zlib';

/** Product photos for the demo: a colour field with soft diagonal bands, as a real PNG. */
export const SWATCH_SIZE_PX = 640;

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const BIT_DEPTH = 8;
const COLOR_TYPE_RGB = 2;
const BYTES_PER_PIXEL = 3;
const FILTER_NONE = 0;
const BAND_WIDTH_PX = 48;
const BAND_SHADE = 0.9;
const HEX_RADIX = 16;
const CHANNEL_MAX = 255;
/** Where each channel starts in `#rrggbb`, and how many hex digits it takes. */
const RED_START = 1;
const GREEN_START = 3;
const BLUE_START = 5;
const HEX_DIGITS_PER_CHANNEL = 2;
const IHDR_LENGTH = 13;
const IHDR_HEIGHT_OFFSET = 4;
const IHDR_BIT_DEPTH_OFFSET = 8;
const IHDR_COLOR_TYPE_OFFSET = 9;
const UINT32_BYTES = 4;
/** Bands alternate between the base colour and the shaded one. */
const BAND_COLORS = 2;

type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
  const channel = (start: number): number =>
    Number.parseInt(hex.slice(start, start + HEX_DIGITS_PER_CHANNEL), HEX_RADIX);
  return [channel(RED_START), channel(GREEN_START), channel(BLUE_START)];
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(UINT32_BYTES);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(UINT32_BYTES);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, checksum]);
}

function header(size: number): Buffer {
  const data = Buffer.alloc(IHDR_LENGTH);
  data.writeUInt32BE(size, 0);
  data.writeUInt32BE(size, IHDR_HEIGHT_OFFSET);
  data.writeUInt8(BIT_DEPTH, IHDR_BIT_DEPTH_OFFSET);
  data.writeUInt8(COLOR_TYPE_RGB, IHDR_COLOR_TYPE_OFFSET);
  return data;
}

function pixelRows(size: number, base: Rgb): Buffer {
  const shaded = base.map((channel) => Math.min(CHANNEL_MAX, Math.round(channel * BAND_SHADE)));
  const rowLength = 1 + size * BYTES_PER_PIXEL;
  const rows = Buffer.alloc(rowLength * size);
  for (let row = 0; row < size; row += 1) {
    rows[row * rowLength] = FILTER_NONE;
    for (let column = 0; column < size; column += 1) {
      const inBand = Math.floor((row + column) / BAND_WIDTH_PX) % BAND_COLORS === 0;
      const color = inBand ? base : shaded;
      rows.set(color, row * rowLength + 1 + column * BYTES_PER_PIXEL);
    }
  }
  return rows;
}

/** A square PNG in the given `#rrggbb` colour. */
export function swatchPng(hex: string, size = SWATCH_SIZE_PX): Buffer {
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header(size)),
    chunk('IDAT', deflateSync(pixelRows(size, parseHex(hex)))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
