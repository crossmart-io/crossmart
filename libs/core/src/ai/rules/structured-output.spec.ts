import { z } from 'zod';
import type { AiCompletion } from '../entities/ai-completion.js';
import { AiStopReason } from '../enums/ai-stop-reason.enum.js';
import { AiOutputRejectedError } from '../errors/ai.errors.js';
import { parseStructuredOutput } from './structured-output.js';

const SCHEMA = z.object({ title: z.string().max(10), rationale: z.string() });

function completion(text: string, stopReason = AiStopReason.Completed): AiCompletion {
  return { text, stopReason, model: 'm', usage: { inputTokens: 1, outputTokens: 1 } };
}

function rejection(text: string, stopReason?: AiStopReason): string {
  try {
    parseStructuredOutput(completion(text, stopReason), SCHEMA);
  } catch (error) {
    if (error instanceof AiOutputRejectedError) return error.reason;
    throw error;
  }
  throw new Error('Expected a rejection');
}

describe('parseStructuredOutput', () => {
  it('returns an answer that matches the schema', () => {
    const output = parseStructuredOutput(
      completion('{"title":"Mug","rationale":"Shorter"}'),
      SCHEMA,
    );
    expect(output).toEqual({ title: 'Mug', rationale: 'Shorter' });
  });

  it('rejects text that is not JSON', () => {
    expect(rejection('Sure! Here is a title: Mug')).toBe('the answer is not JSON');
  });

  it('rejects an answer that breaks the schema, naming the fields but not their content', () => {
    const reason = rejection('{"title":"A title far too long","rationale":42}');
    expect(reason).toBe('the answer does not match its schema at title, rationale');
    expect(reason).not.toContain('far too long');
  });

  it.each([AiStopReason.Refused, AiStopReason.Truncated])(
    'rejects an answer that stopped as %s, even if it parses',
    (stopReason) => {
      expect(rejection('{"title":"Mug","rationale":"x"}', stopReason)).toBe(
        `the model stopped: ${stopReason}`,
      );
    },
  );
});
