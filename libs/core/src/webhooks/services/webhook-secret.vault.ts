import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EnvelopeEncryption, generateSecureToken, type SecretScope } from '@crossmart/common';
import {
  WEBHOOK_SECRET_BYTES,
  WEBHOOK_SECRET_CONTEXT_PREFIX,
  WEBHOOK_SECRET_PREFIX,
  WEBHOOKS_NOT_CONFIGURED,
} from '../webhooks.constants.js';

/** The endpoint a secret belongs to; its sealed value only opens for that endpoint. */
export interface EndpointRef {
  workspaceId: string;
  endpointId: string;
}

/** The sealed secrets of an endpoint, as stored. */
export interface SealedSecrets {
  sealedSecret: string;
  previousSealedSecret: string | null;
  previousSecretExpiresAt: Date | null;
}

/**
 * Makes and keeps webhook signing secrets. They are sealed with the workspace's data key
 * (envelope encryption, like channel credentials), bound to their endpoint, and never logged.
 */
@Injectable()
export class WebhookSecretVault {
  constructor(private readonly encryption: EnvelopeEncryption) {}

  /** A new secret: `whsec_` and 256 random bits. Throws 503 when secrets cannot be sealed. */
  generate(): string {
    this.assertConfigured();
    return `${WEBHOOK_SECRET_PREFIX}${generateSecureToken(WEBHOOK_SECRET_BYTES)}`;
  }

  async seal(endpoint: EndpointRef, secret: string): Promise<string> {
    this.assertConfigured();
    return this.encryption.encrypt(this.scopeOf(endpoint), secret);
  }

  /** The secrets that sign a delivery now: the current one, then the replaced one in its grace. */
  async signingSecrets(endpoint: EndpointRef, sealed: SealedSecrets, now: Date): Promise<string[]> {
    const scope = this.scopeOf(endpoint);
    const current = await this.encryption.decrypt(scope, sealed.sealedSecret);
    const { previousSealedSecret, previousSecretExpiresAt } = sealed;
    if (!previousSealedSecret || !previousSecretExpiresAt || previousSecretExpiresAt <= now) {
      return [current];
    }
    return [current, await this.encryption.decrypt(scope, previousSealedSecret)];
  }

  private assertConfigured(): void {
    if (!this.encryption.isConfigured) {
      throw new ServiceUnavailableException(WEBHOOKS_NOT_CONFIGURED);
    }
  }

  private scopeOf({ workspaceId, endpointId }: EndpointRef): SecretScope {
    return { workspaceId, context: `${WEBHOOK_SECRET_CONTEXT_PREFIX}${endpointId}` };
  }
}
