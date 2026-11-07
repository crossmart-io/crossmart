import {
  ASK_CHARS_PER_TOKEN,
  ASK_CONTEXT_MAX_TOKENS,
  ASK_CONTEXT_MAX_TURNS,
} from '../ask.constants.js';
import { boundedContext, retrievalQuery } from './conversation-context.js';

const turn = (index: number, size = 10) => ({
  question: `q${index}`.padEnd(size, '.'),
  answer: `a${index}`.padEnd(size, '.'),
});

describe('boundedContext', () => {
  it('keeps the latest turns, oldest first', () => {
    const history = Array.from({ length: ASK_CONTEXT_MAX_TURNS + 2 }, (_, index) => turn(index));

    const kept = boundedContext(history);

    expect(kept).toHaveLength(ASK_CONTEXT_MAX_TURNS);
    expect(kept.at(-1)).toEqual(history.at(-1));
    expect(kept[0]).toEqual(history[2]);
  });

  it('drops the oldest turns that do not fit the token budget', () => {
    const half = (ASK_CONTEXT_MAX_TOKENS * ASK_CHARS_PER_TOKEN) / 2;
    const history = [turn(1, half), turn(2, half / 2)];

    expect(boundedContext(history)).toEqual([history[1]]);
  });

  it('is empty for a first question', () => {
    expect(boundedContext([])).toEqual([]);
  });
});

describe('retrievalQuery', () => {
  it('adds the latest earlier questions to the follow-up', () => {
    const history = [
      { question: 'What does Starter include?', answer: '…' },
      { question: 'Can I publish to Shopify?', answer: '…' },
      { question: 'What about inventory?', answer: '…' },
    ];

    expect(retrievalQuery('and on eBay?', history)).toBe(
      'Can I publish to Shopify? What about inventory? and on eBay?',
    );
  });
});
