import { createHash } from 'node:crypto';
import type { ExternalImage } from '@crossmart/connectors';

const DIGEST_ALGORITHM = 'sha256';
const DIGEST_ENCODING = 'hex';

/** A stable digest of images and their order, to tell whether a listing's images changed. */
export function mediaDigest(images: readonly ExternalImage[]): string {
  return createHash(DIGEST_ALGORITHM)
    .update(JSON.stringify(images.map((image) => [image.url, image.altText])))
    .digest(DIGEST_ENCODING);
}
