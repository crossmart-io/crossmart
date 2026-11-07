import type { ComposedAnswer } from '../entities/composed-answer.js';
import type { AskEscalationOffer } from '../entities/ask-reply.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';

const NO_OFFER: AskEscalationOffer = { offered: false, reason: null };

function offer(reason: AskEscalationReason): AskEscalationOffer {
  return { offered: true, reason };
}

/**
 * Whether Ask offers a person, and why, most specific reason first: the caller asked for one,
 * it is a sales question, the docs do not answer it, or the answer is unsure. Questions that
 * are not about Crossmart are never escalated.
 */
export function escalationOffer(composed: ComposedAnswer): AskEscalationOffer {
  const { answer } = composed;
  if (answer.outcome === AskOutcome.OutOfScope) return NO_OFFER;
  if (composed.asksForPerson) return offer(AskEscalationReason.HumanRequested);
  if (composed.salesInquiry) return offer(AskEscalationReason.Sales);
  if (answer.outcome === AskOutcome.Unknown) return offer(AskEscalationReason.Unanswered);
  if (answer.confidence === AskConfidence.Low) return offer(AskEscalationReason.LowConfidence);
  return NO_OFFER;
}
