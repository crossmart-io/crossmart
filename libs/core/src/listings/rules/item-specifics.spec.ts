import { normalizeItemSpecifics, repeatedItemSpecificNames } from './item-specifics.js';

describe('normalizeItemSpecifics', () => {
  it('trims names and values, and drops blank or repeated values', () => {
    expect(
      normalizeItemSpecifics([
        { name: ' Color ', values: [' Blue', 'Blue', '', 'White '] },
        { name: 'Material', values: ['  '] },
        { name: '  ', values: ['Cotton'] },
      ]),
    ).toEqual([{ name: 'Color', values: ['Blue', 'White'] }]);
  });
});

describe('repeatedItemSpecificNames', () => {
  it('names the specifics given twice, whatever their case', () => {
    expect(
      repeatedItemSpecificNames([
        { name: 'Color', values: ['Blue'] },
        { name: 'color ', values: ['Red'] },
        { name: 'Size', values: ['M'] },
      ]),
    ).toEqual(['color ']);
  });
});
