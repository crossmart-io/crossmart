/** Wording that asks for a person, in the languages Ask is asked in most. */
const HUMAN_REQUEST_PATTERNS: readonly RegExp[] = [
  /\b(talk|speak|chat)\s+(to|with)\s+(a\s+|an\s+|some\s*one|somebody|your\s+)?(human|person|real person|agent|representative|support|team|someone)\b/i,
  /\b(human|real person|live agent|customer support|support team)\b.*\b(please|now|help)\b/i,
  /\bcontact\s+(support|a human|a person|the team)\b/i,
  /נציג|לדבר עם (בן אדם|מישהו|נציג)/,
];

/** Wording of a sales question. */
const SALES_PATTERNS: readonly RegExp[] = [
  /\b(enterprise|volume)\s+(plan|pricing|price|deal|license|contract)\b/i,
  /\b(talk|speak)\s+to\s+sales\b/i,
  /\b(book|schedule|request)\s+(a\s+)?demo\b/i,
  /\b(custom|negotiat\w*)\s+(pricing|contract|terms|quote)\b/i,
  /\b(partnership|reseller|white[- ]label)\b/i,
];

/** Whether the question asks for a person, before or whatever the model says. */
export function asksForPerson(question: string): boolean {
  return HUMAN_REQUEST_PATTERNS.some((pattern) => pattern.test(question));
}

/** Whether the question is for sales. */
export function isSalesInquiry(question: string): boolean {
  return SALES_PATTERNS.some((pattern) => pattern.test(question));
}
