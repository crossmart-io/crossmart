import { ASK_CONVERSATION_ID_PREFIX, ASK_ESCALATION_ID_PREFIX } from '@crossmart/core';

const TOKEN_BODY = '[A-Za-z0-9_-]+';

/** A conversation id as Ask issues them: `conv_` and base64url. */
export const CONVERSATION_ID_PATTERN = new RegExp(`^${ASK_CONVERSATION_ID_PREFIX}${TOKEN_BODY}$`);
/** An escalation ticket id as Ask issues them: `esc_` and base64url. */
export const ESCALATION_ID_PATTERN = new RegExp(`^${ASK_ESCALATION_ID_PREFIX}${TOKEN_BODY}$`);
