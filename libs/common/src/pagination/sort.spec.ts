import { SortDirection, sortWithTiebreak } from './sort.js';

describe('sortWithTiebreak', () => {
  it('orders by the field, then by id the same way', () => {
    expect(sortWithTiebreak('title', SortDirection.Desc)).toEqual([
      { title: SortDirection.Desc },
      { id: SortDirection.Desc },
    ]);
  });
});
