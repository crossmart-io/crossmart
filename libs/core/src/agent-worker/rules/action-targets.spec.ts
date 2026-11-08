import { actionTargets } from './action-targets.js';

describe('actionTargets', () => {
  it('reads the store and product a call names', () => {
    expect(actionTargets({ connectionId: 'c-1', productId: 'p-1', title: 'Mug' })).toEqual({
      connectionIds: ['c-1'],
      productIds: ['p-1'],
    });
  });

  it('merges a single product with a list, each once', () => {
    expect(actionTargets({ productId: 'p-1', productIds: ['p-1', 'p-2'] })).toEqual({
      connectionIds: [],
      productIds: ['p-1', 'p-2'],
    });
  });

  it('names nothing for a workspace-wide call or an input of another shape', () => {
    expect(actionTargets({ status: 'failed' })).toEqual({ connectionIds: [], productIds: [] });
    expect(actionTargets(null)).toEqual({ connectionIds: [], productIds: [] });
    expect(actionTargets({ connectionId: 42 })).toEqual({ connectionIds: [], productIds: [] });
  });
});
