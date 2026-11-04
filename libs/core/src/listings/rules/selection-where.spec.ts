import { ListingSource, ListingStatus } from '@crossmart/database';
import { CatalogGap } from '../../catalog/enums/catalog-gap.enum.js';
import {
  addedManuallyWhere,
  addedToStoreWhere,
  removedManuallyWhere,
  selectionFilterWhere,
  selectionWhere,
} from './selection-where.js';

const WS = 'ws-1';
const CONNECTION = 'conn-1';
const rule = {
  filter: { tags: ['summer'], vendor: ' Acme ', gap: CatalogGap.Images },
  includeProductIds: ['p-in'],
  excludeProductIds: ['p-out'],
};
const scope = { workspaceId: WS, connectionId: CONNECTION, rule };

describe('selection conditions', () => {
  it('adds nothing automatically without a rule or with a null filter', () => {
    const none = { workspaceId: WS, id: { in: [] } };

    expect(selectionFilterWhere({ ...scope, rule: null })).toEqual(none);
    expect(selectionFilterWhere({ ...scope, rule: { ...rule, filter: null } })).toEqual(none);
  });

  it('adds every product with an empty filter', () => {
    expect(selectionFilterWhere({ ...scope, rule: { ...rule, filter: {} } })).toEqual({
      workspaceId: WS,
      AND: [{}],
    });
  });

  it('keeps products added by hand or imported, on this connection, until delisted', () => {
    expect(addedToStoreWhere(scope)).toEqual({
      workspaceId: WS,
      OR: [
        {
          listings: {
            some: {
              connectionId: CONNECTION,
              source: { in: [ListingSource.MANUAL, ListingSource.IMPORT] },
              status: { not: ListingStatus.DELISTED },
            },
          },
        },
        { id: { in: ['p-in'] } },
      ],
    });
  });

  it('selects added and matching products, minus those removed by hand', () => {
    expect(selectionWhere(scope)).toEqual({
      workspaceId: WS,
      AND: [
        { OR: [addedToStoreWhere(scope), selectionFilterWhere(scope)] },
        { id: { notIn: ['p-out'] } },
      ],
    });
  });

  it('counts what was added and removed by hand against the automatic rule', () => {
    expect(addedManuallyWhere(scope)).toEqual({
      AND: [
        addedToStoreWhere(scope),
        { id: { notIn: ['p-out'] } },
        { NOT: selectionFilterWhere(scope) },
      ],
    });
    expect(removedManuallyWhere(scope)).toEqual({
      AND: [selectionFilterWhere(scope), { id: { in: ['p-out'] } }],
    });
  });
});
