import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { PricingRule } from '../../channels/entities/pricing-rule.js';
import { CompareAtMode } from '../../channels/enums/compare-at-mode.enum.js';
import { PriceRounding } from '../../channels/enums/price-rounding.enum.js';
import type { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { connectionRecord } from '../../channels/testing/channel-connection.fixtures.js';
import { CONNECTION_ID, connectionView, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import { ConnectionRulesService } from './connection-rules.service.js';

const ACTOR = Actor.user('user-1');
const RULE: PricingRule = {
  adjustmentPercent: '15',
  fixedAmount: '0',
  rounding: PriceRounding.Ending99,
  floor: null,
  compareAt: CompareAtMode.Adjust,
};
const SELECTION = { filter: { tags: ['summer'] }, includeProductIds: [], excludeProductIds: [] };

function setup() {
  const current = connectionView({
    settings: { account: null, productSelection: SELECTION, pricing: null },
  });
  const connections = { get: vi.fn<ChannelConnectionsService['get']>().mockResolvedValue(current) };
  let storedSelection: unknown = SELECTION;
  const records = {
    savePricing: vi
      .fn<ChannelConnectionRepository['savePricing']>()
      .mockResolvedValue(connectionRecord()),
    saveProductSelection: vi
      .fn<ChannelConnectionRepository['saveProductSelection']>()
      .mockResolvedValue(connectionRecord()),
    // Like the repository: the change reads the stored selection, and its result is stored.
    updateProductSelection: vi.fn<ChannelConnectionRepository['updateProductSelection']>(
      (_workspaceId, _connectionId, change) => {
        storedSelection = change(storedSelection);
        return Promise.resolve(connectionRecord());
      },
    ),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new ConnectionRulesService(
    connections as unknown as ChannelConnectionsService,
    records as unknown as ChannelConnectionRepository,
    activity,
  );
  const state = {
    selection: () => storedSelection,
    setSelection: (selection: unknown) => {
      storedSelection = selection;
    },
  };
  return { service, records, activity, state };
}

describe('ConnectionRulesService', () => {
  it('saves only the pricing rule and logs it in words', async () => {
    const { service, records, activity } = setup();

    await service.updatePricing(WORKSPACE_ID, CONNECTION_ID, RULE, ACTOR);

    expect(records.savePricing).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, RULE);
    expect(records.saveProductSelection).not.toHaveBeenCalled();
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ChannelPricingUpdated,
      subject: { id: CONNECTION_ID, label: 'Demo Store' },
      detail: '+15%, .99',
    });
  });

  it('rejects rules outside the bounds with a readable reason', async () => {
    const { service, records } = setup();

    await expect(
      service.updatePricing(
        WORKSPACE_ID,
        CONNECTION_ID,
        { ...RULE, adjustmentPercent: '900' },
        ACTOR,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(records.savePricing).not.toHaveBeenCalled();
  });

  it('replaces or clears only the selection', async () => {
    const { service, records, activity } = setup();

    await service.updateSelection(WORKSPACE_ID, CONNECTION_ID, null, ACTOR);

    expect(records.saveProductSelection).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, null);
    expect(records.savePricing).not.toHaveBeenCalled();
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ChannelSelectionUpdated,
      detail: 'automatic rule removed',
    });
  });

  it('is not found when the connection is not in the workspace', async () => {
    const { service, records } = setup();
    records.saveProductSelection.mockResolvedValue(null);

    await expect(
      service.updateSelection(WORKSPACE_ID, CONNECTION_ID, SELECTION, ACTOR),
    ).rejects.toThrow(NotFoundException);
  });

  it('records products removed by hand, and forgets them once added back', async () => {
    const { service, records, activity, state } = setup();

    const [first, second] = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ];
    await service.changeExclusions(WORKSPACE_ID, CONNECTION_ID, { exclude: [first, second] });
    await service.changeExclusions(WORKSPACE_ID, CONNECTION_ID, { restore: [first] });

    expect(records.updateProductSelection).toHaveBeenCalledTimes(2);
    expect(state.selection()).toEqual({ ...SELECTION, excludeProductIds: [second] });
    expect(activity.entries).toEqual([]);
  });

  it('starts a selection without an automatic rule when none is stored', async () => {
    const { service, state } = setup();
    state.setSelection(null);
    const productId = '33333333-3333-4333-8333-333333333333';

    await service.changeExclusions(WORKSPACE_ID, CONNECTION_ID, { exclude: [productId] });

    expect(state.selection()).toEqual({
      filter: null,
      includeProductIds: [],
      excludeProductIds: [productId],
    });
  });

  it('is not found when excluding on a connection outside the workspace', async () => {
    const { service, records } = setup();
    records.updateProductSelection.mockResolvedValue(null);

    await expect(
      service.changeExclusions(WORKSPACE_ID, CONNECTION_ID, { exclude: [] }),
    ).rejects.toThrow(NotFoundException);
  });
});
