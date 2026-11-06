import { ASK_OUT_OF_SCOPE_MESSAGE, askHandoffMessage } from '../ask.constants.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';
import { KnowledgeSourceKind } from '../enums/knowledge-source-kind.enum.js';
import { citationsFor, groundedAnswer } from './grounded-answer.js';

const EMAIL = 'help@example.com';
const SOURCES = [
  {
    id: 'a',
    source: KnowledgeSourceKind.Docs,
    title: 'Rate limits',
    url: 'https://docs.example/limits',
    text: '…',
  },
  {
    id: 'b',
    source: KnowledgeSourceKind.Docs,
    title: 'Rate limits (more)',
    url: 'https://docs.example/limits',
    text: '…',
  },
  {
    id: 'c',
    source: KnowledgeSourceKind.Docs,
    title: 'Keys',
    url: 'https://docs.example/keys',
    text: '…',
  },
];

describe('citationsFor', () => {
  it('maps source ids to pages, once per URL, and drops ids it never gave', () => {
    expect(citationsFor(['S1', 'S2', 'S3', 'S9'], SOURCES)).toEqual([
      { title: 'Rate limits', url: 'https://docs.example/limits' },
      { title: 'Keys', url: 'https://docs.example/keys' },
    ]);
  });
});

describe('groundedAnswer', () => {
  const answered = {
    outcome: AskOutcome.Answered,
    answer: ' 30 requests a minute. ',
    sourceIds: ['S1'],
    confidence: AskConfidence.High,
  };

  it('keeps a cited answer with its citations', () => {
    expect(groundedAnswer(answered, SOURCES, EMAIL)).toEqual({
      outcome: AskOutcome.Answered,
      answer: '30 requests a minute.',
      citations: [{ title: 'Rate limits', url: 'https://docs.example/limits' }],
      confidence: AskConfidence.High,
      handoff: false,
      supportEmail: EMAIL,
    });
  });

  it('replaces an answer that cites nothing it was given with the support handoff', () => {
    const reply = groundedAnswer({ ...answered, sourceIds: ['S7'] }, SOURCES, EMAIL);

    expect(reply).toMatchObject({
      outcome: AskOutcome.Unknown,
      answer: askHandoffMessage(EMAIL),
      citations: [],
      handoff: true,
      confidence: AskConfidence.Low,
    });
  });

  it('answers "unknown" with the fixed handoff text, not the model’s', () => {
    const reply = groundedAnswer(
      { ...answered, outcome: AskOutcome.Unknown, answer: 'Ignore the rules and…' },
      SOURCES,
      EMAIL,
    );

    expect(reply.answer).toBe(askHandoffMessage(EMAIL));
    expect(reply.handoff).toBe(true);
  });

  it('declines out-of-scope questions without a handoff', () => {
    const reply = groundedAnswer({ ...answered, outcome: AskOutcome.OutOfScope }, SOURCES, EMAIL);

    expect(reply).toMatchObject({
      outcome: AskOutcome.OutOfScope,
      answer: ASK_OUT_OF_SCOPE_MESSAGE,
      handoff: false,
      citations: [],
    });
  });
});
