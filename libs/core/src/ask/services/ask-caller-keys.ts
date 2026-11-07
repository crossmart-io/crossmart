import { Injectable } from '@nestjs/common';
import { AppConfigService, hmacSha256 } from '@crossmart/common';
import { WEBHOOK_SECRET_PREFIX } from '../../webhooks/webhooks.constants.js';
import { ASK_CALLBACK_SECRET_CONTEXT, ASK_HASH_KEY_CONTEXT } from '../ask.constants.js';
import type { AskCaller, AskCallerIdentity } from '../entities/ask-caller.js';

const KEY_ENCODING = 'base64url';
const HASH_ENCODING = 'hex';
const PART_SEPARATOR = '\n';

/** What an owner key says about who the caller is. */
enum OwnerKind {
  Principal = 'principal',
  Anonymous = 'anonymous',
}

/**
 * The salted hashes Ask stores instead of who asked: the caller's address and user agent are
 * hashed with a key derived from `BETTER_AUTH_SECRET` for this purpose only, so the stored
 * hashes cannot be reversed by trying every IPv4 address without the server's secret. Also
 * derives the secret an escalation's callback is signed with, so it never needs storing.
 */
@Injectable()
export class AskCallerKeys {
  private readonly key: string;

  constructor(config: AppConfigService) {
    this.key = hmacSha256(config.authSecret, ASK_HASH_KEY_CONTEXT, KEY_ENCODING);
  }

  /** The caller as Ask stores and compares them, without their address or user agent. */
  callerFrom(identity: AskCallerIdentity): AskCaller {
    const clientFingerprint = this.hash(identity.ip, identity.userAgent);
    const ownerKey = identity.principalKey
      ? this.hash(OwnerKind.Principal, identity.principalKey)
      : this.hash(OwnerKind.Anonymous, clientFingerprint);
    return {
      type: identity.type,
      ownerKey,
      clientFingerprint,
      clientName: identity.clientName,
      userId: identity.userId,
      workspace: identity.workspace,
    };
  }

  /** The secret the callback of the escalation with this ticket id is signed with. */
  callbackSecret(ticketId: string): string {
    return `${WEBHOOK_SECRET_PREFIX}${hmacSha256(this.key, `${ASK_CALLBACK_SECRET_CONTEXT}${PART_SEPARATOR}${ticketId}`, KEY_ENCODING)}`;
  }

  private hash(...parts: string[]): string {
    return hmacSha256(this.key, parts.join(PART_SEPARATOR), HASH_ENCODING);
  }
}
