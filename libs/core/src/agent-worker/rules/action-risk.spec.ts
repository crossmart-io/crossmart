import { randomUUID } from 'node:crypto';
import { AgentToolName } from '../../agent-tools/agent-tools.constants.js';
import { ALL_TOOLS } from '../../agent-tools/tools/index.js';
import { AgentWorkerActionRisk } from '../enums/agent-worker-action-risk.enum.js';
import { assessRisks } from './action-risk.js';

function spec(name: string) {
  const found = ALL_TOOLS.find((tool) => tool.name === name);
  if (!found) throw new Error(name);
  return found;
}

describe('assessRisks', () => {
  it('marks deletions as destructive', () => {
    expect(
      assessRisks({ spec: spec('remove_product_from_store'), input: {}, publishesInBatch: 0 }),
    ).toEqual([AgentWorkerActionRisk.Destructive]);
  });

  it('marks a listing update as a price change only when it sets prices', () => {
    const update = spec(AgentToolName.UpdateListing);
    expect(assessRisks({ spec: update, input: { title: 'New' }, publishesInBatch: 0 })).toEqual([]);
    expect(
      assessRisks({ spec: update, input: { variantPrices: [] }, publishesInBatch: 0 }),
    ).toEqual([AgentWorkerActionRisk.PriceChange]);
  });

  it('marks publishing as bulk past the threshold, and calls naming many products', () => {
    const add = spec('add_product_to_store');
    expect(assessRisks({ spec: add, input: {}, publishesInBatch: 5 })).toEqual([]);
    expect(assessRisks({ spec: add, input: {}, publishesInBatch: 6 })).toEqual([
      AgentWorkerActionRisk.Bulk,
    ]);
    const productIds = Array.from({ length: 6 }, () => randomUUID());
    expect(
      assessRisks({ spec: spec('generate_content'), input: { productIds }, publishesInBatch: 0 }),
    ).toEqual([AgentWorkerActionRisk.Bulk]);
  });

  it('leaves an ordinary change without risks', () => {
    expect(
      assessRisks({ spec: spec('retry_store_listing'), input: {}, publishesInBatch: 1 }),
    ).toEqual([]);
  });

  it('trusts a preview read from the API on whether prices really change', () => {
    const replace = spec(AgentToolName.ReplaceProduct);
    const input = { variants: [{ id: 'v1', price: '20.00' }] };
    const unchanged = {
      target: 'Mug',
      changes: [{ field: 'title', before: 'Mug', after: 'Big Mug' }],
    };
    const changed = {
      target: 'Mug',
      changes: [{ field: 'price (MUG-1)', before: '20.00', after: '22.00' }],
    };
    expect(assessRisks({ spec: replace, input, publishesInBatch: 0, preview: unchanged })).toEqual([
      AgentWorkerActionRisk.Destructive,
    ]);
    expect(assessRisks({ spec: replace, input, publishesInBatch: 0, preview: changed })).toEqual([
      AgentWorkerActionRisk.Destructive,
      AgentWorkerActionRisk.PriceChange,
    ]);
    expect(
      assessRisks({
        spec: replace,
        input,
        publishesInBatch: 0,
        preview: { target: null, changes: [] },
      }),
    ).toContain(AgentWorkerActionRisk.PriceChange);
  });
});
