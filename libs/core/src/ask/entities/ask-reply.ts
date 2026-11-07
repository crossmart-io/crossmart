import type { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import type { AskAnswer } from './ask-answer.js';

/** Whether Ask offers a person for this answer, and why. */
export interface AskEscalationOffer {
  offered: boolean;
  reason: AskEscalationReason | null;
}

/** An answer within its conversation: what the caller gets back. */
export interface AskReply extends AskAnswer {
  /** Send it with the next question to continue the conversation. */
  conversationId: string;
  /** The stored turn; A2A uses it as the task id. */
  turnId: string;
  escalation: AskEscalationOffer;
}
