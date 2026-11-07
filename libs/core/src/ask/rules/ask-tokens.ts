import { generateSecureToken, hashSecret } from '@crossmart/common';
import {
  ASK_CONVERSATION_ID_PREFIX,
  ASK_ESCALATION_ID_PREFIX,
  ASK_TOKEN_BYTES,
} from '../ask.constants.js';

/** A new, unguessable conversation id. Only its hash is stored. */
export function newConversationToken(): string {
  return `${ASK_CONVERSATION_ID_PREFIX}${generateSecureToken(ASK_TOKEN_BYTES)}`;
}

/** A new, unguessable escalation ticket id: the capability to read the ticket. */
export function newEscalationToken(): string {
  return `${ASK_ESCALATION_ID_PREFIX}${generateSecureToken(ASK_TOKEN_BYTES)}`;
}

/** What is stored of a conversation or ticket id: its SHA-256. */
export function tokenHash(token: string): string {
  return hashSecret(token);
}
