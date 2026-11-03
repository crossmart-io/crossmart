import { toCountedPage, toCursorPage } from './cursor-page.js';

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `row-${index}` }));

describe('toCursorPage', () => {
  it('drops the extra row and points the cursor at the last row returned', () => {
    expect(toCursorPage(rows(3), 2)).toEqual({ rows: rows(2), nextCursor: 'row-1' });
  });

  it('has no cursor on the last page', () => {
    expect(toCursorPage(rows(2), 2)).toEqual({ rows: rows(2), nextCursor: null });
    expect(toCursorPage([], 2)).toEqual({ rows: [], nextCursor: null });
  });

  it('keeps the total of a counted query', () => {
    expect(toCountedPage({ records: rows(3), total: 40 }, 2)).toEqual({
      rows: rows(2),
      nextCursor: 'row-1',
      total: 40,
    });
  });
});
