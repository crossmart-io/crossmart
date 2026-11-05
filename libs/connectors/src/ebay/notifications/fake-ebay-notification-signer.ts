import { generateKeyPairSync, type KeyObject, sign } from 'node:crypto';
import { EbaySignatureAlgorithm, EbaySignatureDigest } from './ebay-notification.enums.js';
import type { EbayPublicKeyResponse } from './ebay-public-key.js';

const CURVE = 'prime256v1';
const SIGNING_DIGEST = 'sha1';
const BASE64 = 'base64';
const DER_FORMAT = 'der';
const SPKI_TYPE = 'spki';
const PEM_BEGIN = '-----BEGIN PUBLIC KEY-----';
const PEM_END = '-----END PUBLIC KEY-----';
const SIGNATURE_ALG = 'ecdsa';

/**
 * Signs notifications the way eBay does, with a key generated for the test: an ECDSA P-256
 * signature over SHA-1, in an `X-EBAY-SIGNATURE` header. For tests only; never a real eBay key.
 */
export class FakeEbayNotificationSigner {
  private readonly privateKey: KeyObject;
  private readonly publicKey: KeyObject;

  constructor(readonly keyId: string) {
    const pair = generateKeyPairSync('ec', { namedCurve: CURVE });
    this.privateKey = pair.privateKey;
    this.publicKey = pair.publicKey;
  }

  /** What `getPublicKey` answers for this key: a PEM on one line, as eBay sends it. */
  publicKeyResponse(): EbayPublicKeyResponse {
    const der = this.publicKey.export({ format: DER_FORMAT, type: SPKI_TYPE });
    return {
      key: `${PEM_BEGIN}${der.toString(BASE64)}${PEM_END}`,
      algorithm: EbaySignatureAlgorithm.Ecdsa,
      digest: EbaySignatureDigest.Sha1,
    };
  }

  /** The `X-EBAY-SIGNATURE` header for `body`. */
  signatureHeader(body: string | Buffer, keyId = this.keyId): string {
    const signature = sign(SIGNING_DIGEST, Buffer.from(body), this.privateKey).toString(BASE64);
    const header = { alg: SIGNATURE_ALG, kid: keyId, signature, digest: EbaySignatureDigest.Sha1 };
    return Buffer.from(JSON.stringify(header)).toString(BASE64);
  }
}
