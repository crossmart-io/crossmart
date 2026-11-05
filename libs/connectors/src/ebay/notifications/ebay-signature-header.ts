import { z } from 'zod';
import { EBAY_PUBLIC_KEY_ID_PATTERN } from '../ebay.constants.js';

const BASE64 = 'base64';
const UTF8 = 'utf8';

/** The decoded `X-EBAY-SIGNATURE` header; eBay also sends `alg` and `digest`, read from the key. */
const ebaySignatureHeaderSchema = z.object({
  kid: z.string().regex(EBAY_PUBLIC_KEY_ID_PATTERN),
  signature: z.string().min(1),
});

export type EbaySignatureHeader = z.infer<typeof ebaySignatureHeaderSchema>;

/** The key id and signature of a notification, or null when the header is missing or malformed. */
export function parseEbaySignatureHeader(header: string | undefined): EbaySignatureHeader | null {
  if (!header) return null;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(header, BASE64).toString(UTF8));
    const parsed = ebaySignatureHeaderSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
