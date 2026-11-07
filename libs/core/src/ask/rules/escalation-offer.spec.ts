import type { ComposedAnswer } from '../entities/composed-answer.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';
import { escalationOffer } from './escalation-offer.js';

function composed(overrides: Partial<ComposedAnswer> = {}, outcome = AskOutcome.Answered) {
  return {
    answer: {
      outcome,
      answer: 'text',
      citations: [],
      confidence: AskConfidence.High,
      handoff: false,
      supportEmail: 'help@example.com',
    },
    model: null,
    cached: false,
    lookups: [],
    asksForPerson: false,
    salesInquiry: false,
    ...overrides,
  } satisfies ComposedAnswer;
}

describe('escalationOffer', () => {
  it('offers nothing for a confident answer', () => {
    expect(escalationOffer(composed())).toEqual({ offered: false, reason: null });
  });

  it('offers a person when the docs do not answer', () => {
    expect(escalationOffer(composed({}, AskOutcome.Unknown)).reason).toBe(
      AskEscalationReason.Unanswered,
    );
  });

  it('offers a person for a low-confidence answer', () => {
    const unsure = composed();
    unsure.answer.confidence = AskConfidence.Low;

    expect(escalationOffer(unsure).reason).toBe(AskEscalationReason.LowConfidence);
  });

  it('puts a request for a person and sales before the outcome', () => {
    expect(escalationOffer(composed({ asksForPerson: true }, AskOutcome.Unknown)).reason).toBe(
      AskEscalationReason.HumanRequested,
    );
    expect(escalationOffer(composed({ salesInquiry: true })).reason).toBe(
      AskEscalationReason.Sales,
    );
  });

  it('never offers a person for questions that are not about Crossmart', () => {
    expect(escalationOffer(composed({ asksForPerson: true }, AskOutcome.OutOfScope)).offered).toBe(
      false,
    );
  });
});
