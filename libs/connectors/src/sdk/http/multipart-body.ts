import { randomBytes } from 'node:crypto';
import { MULTIPART_FORM_CONTENT_TYPE } from './http.constants.js';

const BOUNDARY_PREFIX = '----crossmart-';
const BOUNDARY_RANDOM_BYTES = 16;
const BOUNDARY_ENCODING = 'hex';
const LINE_BREAK = '\r\n';
const DASHES = '--';
const QUOTE_PATTERN = /["\r\n]/g;

/** A file part of a multipart form: its bytes, name and media type. */
export interface MultipartFile {
  bytes: Uint8Array;
  fileName: string;
  contentType: string;
}

/** The fields of a multipart form: text values and files. */
export type MultipartFields = Readonly<Record<string, string | MultipartFile>>;

/** An encoded `multipart/form-data` body and the `content-type` that names its boundary. */
export interface MultipartBody {
  contentType: string;
  bytes: Uint8Array<ArrayBuffer>;
}

/** Field and file names go inside quotes; quotes and line breaks would end the header. */
function quoted(value: string): string {
  return `"${value.replace(QUOTE_PATTERN, '_')}"`;
}

function partHeader(boundary: string, name: string, value: string | MultipartFile): string {
  const disposition = `Content-Disposition: form-data; name=${quoted(name)}`;
  if (typeof value === 'string') {
    return `${DASHES}${boundary}${LINE_BREAK}${disposition}${LINE_BREAK}${LINE_BREAK}`;
  }
  return (
    `${DASHES}${boundary}${LINE_BREAK}${disposition}; filename=${quoted(value.fileName)}` +
    `${LINE_BREAK}Content-Type: ${value.contentType}${LINE_BREAK}${LINE_BREAK}`
  );
}

/**
 * Encodes a `multipart/form-data` body (RFC 7578), for uploads such as listing images. The
 * boundary is random, so file contents cannot end a part early.
 */
export function multipartBody(
  fields: MultipartFields,
  boundary = `${BOUNDARY_PREFIX}${randomBytes(BOUNDARY_RANDOM_BYTES).toString(BOUNDARY_ENCODING)}`,
): MultipartBody {
  const chunks: Buffer[] = [];
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(partHeader(boundary, name, value)));
    chunks.push(typeof value === 'string' ? Buffer.from(value) : Buffer.from(value.bytes));
    chunks.push(Buffer.from(LINE_BREAK));
  }
  chunks.push(Buffer.from(`${DASHES}${boundary}${DASHES}${LINE_BREAK}`));
  return {
    contentType: `${MULTIPART_FORM_CONTENT_TYPE}; boundary=${boundary}`,
    bytes: Buffer.concat(chunks),
  };
}
