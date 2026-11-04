import { ImageContentType } from './enums/image-content-type.enum.js';

interface SignaturePart {
  offset: number;
  bytes: Buffer;
}

const HEX = 'hex';
const LATIN1 = 'latin1';
/** A WebP file is a RIFF container whose format tag starts at byte 8. */
const RIFF_FORMAT_OFFSET = 8;

/** Leading bytes of each accepted format. */
const SIGNATURES: readonly { type: ImageContentType; parts: SignaturePart[] }[] = [
  { type: ImageContentType.Jpeg, parts: [{ offset: 0, bytes: Buffer.from('ffd8ff', HEX) }] },
  {
    type: ImageContentType.Png,
    parts: [{ offset: 0, bytes: Buffer.from('89504e470d0a1a0a', HEX) }],
  },
  { type: ImageContentType.Gif, parts: [{ offset: 0, bytes: Buffer.from('GIF8', LATIN1) }] },
  {
    type: ImageContentType.Webp,
    parts: [
      { offset: 0, bytes: Buffer.from('RIFF', LATIN1) },
      { offset: RIFF_FORMAT_OFFSET, bytes: Buffer.from('WEBP', LATIN1) },
    ],
  },
];

function matches(content: Buffer, { offset, bytes }: SignaturePart): boolean {
  return content.subarray(offset, offset + bytes.length).equals(bytes);
}

/** The real format of an upload, read from its bytes. Never trust the file name or header. */
export function detectImageType(content: Buffer): ImageContentType | null {
  const signature = SIGNATURES.find(({ parts }) => parts.every((part) => matches(content, part)));
  return signature?.type ?? null;
}
