import { slicePageWindow, toPageWindow } from './page-window.js';

describe('toPageWindow', () => {
  it('reads one row more than the limit, from the start', () => {
    expect(toPageWindow({ limit: 25 })).toEqual({ take: 26 });
  });

  it('skips the rows of the earlier pages for a page number', () => {
    expect(toPageWindow({ limit: 25, page: 3 })).toEqual({ take: 26, skip: 50 });
  });

  it('reads on after the cursor row, unless a page number is given', () => {
    expect(toPageWindow({ limit: 10, cursor: 'row-9' })).toEqual({
      take: 11,
      cursor: { id: 'row-9' },
      skip: 1,
    });
    expect(toPageWindow({ limit: 10, cursor: 'row-9', page: 1 })).toEqual({ take: 11, skip: 0 });
  });
});

describe('slicePageWindow', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];

  it('takes one id more than the limit, from the start or a page', () => {
    expect(slicePageWindow(ids, { limit: 2 })).toEqual(['a', 'b', 'c']);
    expect(slicePageWindow(ids, { limit: 2, page: 3 })).toEqual(['e']);
  });

  it('reads on after the cursor id', () => {
    expect(slicePageWindow(ids, { limit: 2, cursor: 'b' })).toEqual(['c', 'd', 'e']);
  });

  it('is empty for a cursor it does not know', () => {
    expect(slicePageWindow(ids, { limit: 2, cursor: 'z' })).toEqual([]);
  });
});
