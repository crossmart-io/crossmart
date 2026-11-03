import { CatalogGap } from '../../catalog/enums/catalog-gap.enum.js';
import {
  addedManuallyWhere,
  removedManuallyWhere,
  selectionFilterWhere,
  selectionWhere,
} from './selection-where.js';

const WS = 'ws-1';
const rule = {
  filter: { tags: ['summer'], vendor: ' Acme ', gap: CatalogGap.Images },
  includeProductIds: ['p-in'],
  excludeProductIds: ['p-out'],
};

describe('selection conditions', () => {
  it('selects every product of the workspace without a rule', () => {
    expect(selectionWhere(WS, null)).toEqual({ workspaceId: WS });
    expect(selectionFilterWhere(WS, null)).toEqual({ workspaceId: WS });
  });

  it('reuses the catalog list filters: tags, vendor (ignoring case) and gaps', () => {
    expect(selectionFilterWhere(WS, rule)).toMatchObject({
      workspaceId: WS,
      tags: { hasSome: ['summer'] },
      vendor: { equals: 'Acme', mode: 'insensitive' },
      media: { none: {} },
    });
  });

  it('adds included ids to the filter’s matches and lets exclusions win', () => {
    expect(selectionWhere(WS, rule)).toEqual({
      workspaceId: WS,
      AND: [
        { OR: [selectionFilterWhere(WS, rule), { id: { in: ['p-in'] } }] },
        { id: { notIn: ['p-out'] } },
      ],
    });
  });

  it('matches nothing by filter when the filter is null, so only picked products count', () => {
    const picked = { ...rule, filter: null };

    expect(selectionFilterWhere(WS, picked)).toEqual({ workspaceId: WS, id: { in: [] } });
  });

  it('counts manual additions and removals against the filter', () => {
    expect(addedManuallyWhere(WS, rule)).toEqual({
      workspaceId: WS,
      id: { in: ['p-in'], notIn: ['p-out'] },
      NOT: selectionFilterWhere(WS, rule),
    });
    expect(removedManuallyWhere(WS, rule)).toEqual({
      AND: [selectionFilterWhere(WS, rule), { id: { in: ['p-out'] } }],
    });
  });
});
