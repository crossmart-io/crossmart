import type { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import type { AskAnswer } from './ask-answer.js';

/** An answer with how it was made, for the conversation log and the escalation offer. */
export interface ComposedAnswer {
  answer: AskAnswer;
  /** The model that answered; null when none was called. */
  model: string | null;
  /** True when the answer came from the cache. */
  cached: boolean;
  lookups: AccountLookupKind[];
  /** The caller asked for a person. */
  asksForPerson: boolean;
  /** A sales question. */
  salesInquiry: boolean;
}
