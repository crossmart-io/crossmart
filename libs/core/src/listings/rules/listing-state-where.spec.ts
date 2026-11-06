import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { settledStateConditions, unsettledWhere } from './listing-state-where.js';

const SCOPE = {
  workspaceId: 'ws-1',
  connectionId: 'conn-1',
  rule: { filter: {}, includeProductIds: [], excludeProductIds: ['p-9'] },
};

describe('settledStateConditions', () => {
  const conditions = settledStateConditions(SCOPE);

  it('keeps every condition to the workspace and the store', () => {
    for (const where of Object.values(conditions).flat()) {
      const json = JSON.stringify(where);
      expect(json).toContain('"workspaceId":"ws-1"');
      expect(json).toContain('"connectionId":"conn-1"');
    }
  });

  it('leaves needing details and ready to the connector’s check', () => {
    expect(conditions[ListingDisplayState.NeedsDetails]).toEqual([]);
    expect(conditions[ListingDisplayState.Ready]).toEqual([]);
  });

  it('splits listed products by whether a sync is updating them', () => {
    const [publishing] = conditions[ListingDisplayState.Publishing];
    const [published] = conditions[ListingDisplayState.Published];
    expect(JSON.stringify(publishing)).toContain('"syncRequestedAt":{"not":null}');
    expect(JSON.stringify(published)).toContain('"NOT":{"listings"');
  });

  it('counts removed products by hand and those the store delisted', () => {
    expect(conditions[ListingDisplayState.Removed]).toHaveLength(2);
    expect(JSON.stringify(conditions[ListingDisplayState.Removed][0])).toContain('p-9');
    expect(JSON.stringify(conditions[ListingDisplayState.Removed][1])).toContain('DELISTED');
  });
});

describe('unsettledWhere', () => {
  it('reads selected products off the channel, and selected failures', () => {
    const where = unsettledWhere(SCOPE);
    expect(where.OR).toHaveLength(2);
    expect(JSON.stringify(where)).toContain('ERROR');
  });
});
