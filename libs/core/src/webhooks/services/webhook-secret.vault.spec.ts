import { randomBytes } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import {
  AesGcmEnvelopeEncryption,
  DecryptionError,
  InMemoryDataKeyStore,
  MasterKeyRing,
} from '@crossmart/common';
import { WEBHOOK_SECRET_PREFIX } from '../webhooks.constants.js';
import {
  type EndpointRef,
  type SealedSecrets,
  WebhookSecretVault,
} from './webhook-secret.vault.js';

const ENDPOINT: EndpointRef = { workspaceId: 'ws-1', endpointId: 'endpoint-1' };
const OTHER_ENDPOINT: EndpointRef = { workspaceId: 'ws-1', endpointId: 'endpoint-2' };
const NOW = new Date('2026-11-01T12:00:00Z');
const AN_HOUR_MS = 60 * 60 * 1000;

function vaultWith(currentKey?: string): WebhookSecretVault {
  const ring = MasterKeyRing.fromSettings({ currentKey, currentVersion: 1 });
  return new WebhookSecretVault(new AesGcmEnvelopeEncryption(ring, new InMemoryDataKeyStore()));
}

function configuredVault(): WebhookSecretVault {
  return vaultWith(randomBytes(32).toString('base64'));
}

function sealedOnly(sealedSecret: string, previous: Partial<SealedSecrets> = {}): SealedSecrets {
  return { sealedSecret, previousSealedSecret: null, previousSecretExpiresAt: null, ...previous };
}

describe('WebhookSecretVault', () => {
  it('generates prefixed secrets that never repeat', () => {
    const vault = configuredVault();

    const first = vault.generate();
    const second = vault.generate();

    expect(first.startsWith(WEBHOOK_SECRET_PREFIX)).toBe(true);
    expect(first.length).toBeGreaterThan(WEBHOOK_SECRET_PREFIX.length + 32);
    expect(first).not.toBe(second);
  });

  it('opens a sealed secret for the endpoint it was sealed for', async () => {
    const vault = configuredVault();
    const secret = vault.generate();

    const sealed = await vault.seal(ENDPOINT, secret);

    expect(sealed).not.toContain(secret);
    expect(await vault.signingSecrets(ENDPOINT, sealedOnly(sealed), NOW)).toEqual([secret]);
  });

  it('does not open a secret sealed for another endpoint', async () => {
    const vault = configuredVault();
    const sealed = await vault.seal(ENDPOINT, vault.generate());

    await expect(vault.signingSecrets(OTHER_ENDPOINT, sealedOnly(sealed), NOW)).rejects.toThrow(
      DecryptionError,
    );
  });

  it('signs with the replaced secret too while its grace period lasts', async () => {
    const vault = configuredVault();
    const [current, previous] = [vault.generate(), vault.generate()];
    const sealed = await vault.seal(ENDPOINT, current);
    const previousSealedSecret = await vault.seal(ENDPOINT, previous);
    const inGrace = sealedOnly(sealed, {
      previousSealedSecret,
      previousSecretExpiresAt: new Date(NOW.getTime() + AN_HOUR_MS),
    });
    const expired = { ...inGrace, previousSecretExpiresAt: NOW };

    expect(await vault.signingSecrets(ENDPOINT, inGrace, NOW)).toEqual([current, previous]);
    expect(await vault.signingSecrets(ENDPOINT, expired, NOW)).toEqual([current]);
  });

  it('refuses to make or seal secrets without a master key', async () => {
    const vault = vaultWith();

    expect(() => vault.generate()).toThrow(ServiceUnavailableException);
    await expect(vault.seal(ENDPOINT, 'whsec_x')).rejects.toThrow(ServiceUnavailableException);
  });
});
