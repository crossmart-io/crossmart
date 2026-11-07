import { ASK_REDACTED } from '../ask.constants.js';

/**
 * Obvious secrets people paste into questions: Crossmart API keys (`cm_…`), Stripe-style keys
 * (`sk_…`, `rk_…`, `pk_…` are public, so not), signing secrets (`whsec_…`), Anthropic and
 * OpenAI keys (`sk-…`), JSON web tokens and bearer tokens.
 */
const SECRET_PATTERNS: readonly RegExp[] = [
  /\bcm_[A-Za-z0-9_-]{12,}/g,
  /\b(?:sk|rk)_(?:live_|test_)?[A-Za-z0-9]{12,}/g,
  /\bsk-[A-Za-z0-9_-]{16,}/g,
  /\bwhsec_[A-Za-z0-9_+/=-]{12,}/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/gi,
];
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * The text with obvious secrets, and email addresses, replaced by `[redacted]`. A simple
 * pattern filter applied before a question or answer is stored: it does not catch every secret,
 * so the stored log is still treated as confidential.
 */
export function redactSecrets(text: string): string {
  const withoutSecrets = SECRET_PATTERNS.reduce(
    (redacted, pattern) => redacted.replace(pattern, ASK_REDACTED),
    text,
  );
  return withoutSecrets.replace(EMAIL_PATTERN, ASK_REDACTED);
}
