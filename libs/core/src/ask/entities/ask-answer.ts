import type { AskConfidence } from '../enums/ask-confidence.enum.js';
import type { AskOutcome } from '../enums/ask-outcome.enum.js';

/** A public page the answer is based on. */
export interface AskCitation {
  title: string;
  url: string;
}

/** Ask Crossmart's reply to one question. Holds no data of any workspace. */
export interface AskAnswer {
  outcome: AskOutcome;
  answer: string;
  citations: AskCitation[];
  confidence: AskConfidence;
  /** True when a person should take over: the reply points to `supportEmail`. */
  handoff: boolean;
  supportEmail: string;
}
