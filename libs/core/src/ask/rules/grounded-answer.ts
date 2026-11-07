import { ASK_OUT_OF_SCOPE_MESSAGE, askHandoffMessage } from '../ask.constants.js';
import type { AskAnswer, AskCitation } from '../entities/ask-answer.js';
import type { PromptSource } from '../entities/prompt-source.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';
import type { AskGroundableOutput } from './ask-answer.schema.js';

/** The pages behind the source ids the model named; ids it was not given are dropped. */
export function citationsFor(
  sourceIds: readonly string[],
  sources: readonly PromptSource[],
): AskCitation[] {
  const byId = new Map(sources.map(({ id, chunk }) => [id, chunk]));
  const citations = new Map<string, AskCitation>();
  for (const sourceId of sourceIds) {
    const chunk = byId.get(sourceId);
    if (chunk && !citations.has(chunk.url)) {
      citations.set(chunk.url, { title: chunk.title, url: chunk.url });
    }
  }
  return [...citations.values()];
}

/** The reply when the sources do not answer: a fixed text pointing to support. */
export function unknownAnswer(supportEmail: string): AskAnswer {
  return {
    outcome: AskOutcome.Unknown,
    answer: askHandoffMessage(supportEmail),
    citations: [],
    confidence: AskConfidence.Low,
    handoff: true,
    supportEmail,
  };
}

function outOfScopeAnswer(supportEmail: string): AskAnswer {
  return {
    outcome: AskOutcome.OutOfScope,
    answer: ASK_OUT_OF_SCOPE_MESSAGE,
    citations: [],
    confidence: AskConfidence.Low,
    handoff: false,
    supportEmail,
  };
}

/**
 * Turns the model's output into the reply. Only an answer that cites at least one source it
 * was given keeps the model's text; anything else gets a fixed reply, so an ungrounded or
 * manipulated answer never reaches the caller.
 */
export function groundedAnswer(
  output: AskGroundableOutput,
  sources: readonly PromptSource[],
  supportEmail: string,
): AskAnswer {
  if (output.outcome === AskOutcome.OutOfScope) return outOfScopeAnswer(supportEmail);
  const citations = citationsFor(output.sourceIds, sources);
  if (output.outcome !== AskOutcome.Answered || !citations.length) {
    return unknownAnswer(supportEmail);
  }
  return {
    outcome: AskOutcome.Answered,
    answer: output.answer.trim(),
    citations,
    confidence: output.confidence,
    handoff: false,
    supportEmail,
  };
}
