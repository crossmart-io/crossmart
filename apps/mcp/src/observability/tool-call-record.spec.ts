import { ToolCallOutcome } from './mcp-log.constants.js';
import { itemCount, toToolCallRecord } from './tool-call-record.js';

describe('itemCount', () => {
  it('counts an array or a page’s items, and nothing else', () => {
    expect(itemCount([1, 2, 3])).toBe(3);
    expect(itemCount({ items: [1], total: 9 })).toBe(1);
    expect(itemCount({ id: 'p-1' })).toBeUndefined();
    expect(itemCount(null)).toBeUndefined();
  });
});

describe('toToolCallRecord', () => {
  it('keeps the outcome and counts, never the answer', () => {
    const record = toToolCallRecord(
      'list_products',
      { isError: false, text: '{"items":[{"title":"Mug"}]}', value: { items: [{ title: 'Mug' }] } },
      5,
    );

    expect(record).toEqual({
      tool: 'list_products',
      outcome: ToolCallOutcome.Ok,
      durationMs: 5,
      status: undefined,
      code: undefined,
      items: 1,
    });
  });

  it('calls a stored proposal proposed, and a refusal refused', () => {
    const proposed = toToolCallRecord(
      'create_product',
      { isError: false, text: '', proposed: true },
      1,
    );
    const refused = toToolCallRecord(
      'x',
      { isError: true, text: '', status: 402, code: 'limit' },
      1,
    );

    expect(proposed.outcome).toBe(ToolCallOutcome.Proposed);
    expect(refused).toMatchObject({ outcome: ToolCallOutcome.Refused, status: 402, code: 'limit' });
  });
});
