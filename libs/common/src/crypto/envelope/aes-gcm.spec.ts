import { randomBytes } from 'node:crypto';
import { openAesGcm, sealAesGcm } from './aes-gcm.js';
import { DecryptionError } from './encryption-errors.js';

const KEY = randomBytes(32);
const CONTEXT = 'channel-connection:1';

describe('sealAesGcm / openAesGcm', () => {
  it('round-trips a value and never returns the plaintext in the sealed form', () => {
    const sealed = sealAesGcm(KEY, Buffer.from('shpat_secret'), CONTEXT);

    expect(sealed).toMatch(/^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(sealed).not.toContain('shpat_secret');
    expect(openAesGcm(KEY, sealed, CONTEXT).toString()).toBe('shpat_secret');
  });

  it('uses a fresh IV for every value', () => {
    const plaintext = Buffer.from('same');

    expect(sealAesGcm(KEY, plaintext, CONTEXT)).not.toBe(sealAesGcm(KEY, plaintext, CONTEXT));
  });

  it('refuses another context, another key, tampering and unknown formats', () => {
    const sealed = sealAesGcm(KEY, Buffer.from('token'), CONTEXT);
    const [version, iv, tag, ciphertext] = sealed.split('.');
    const flipped = `${version}.${iv}.${tag}.${ciphertext.slice(0, -2)}AA`;

    expect(() => openAesGcm(KEY, sealed, 'channel-connection:2')).toThrow(DecryptionError);
    expect(() => openAesGcm(randomBytes(32), sealed, CONTEXT)).toThrow(DecryptionError);
    expect(() => openAesGcm(KEY, flipped, CONTEXT)).toThrow(DecryptionError);
    expect(() => openAesGcm(KEY, `v9.${iv}.${tag}.${ciphertext}`, CONTEXT)).toThrow(
      DecryptionError,
    );
    expect(() => openAesGcm(KEY, 'not-sealed', CONTEXT)).toThrow(DecryptionError);
  });

  it('rejects keys of the wrong size', () => {
    expect(() => sealAesGcm(randomBytes(16), Buffer.from('x'), CONTEXT)).toThrow(RangeError);
  });
});
