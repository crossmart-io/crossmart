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
  const records = {
    saveSettings: vi
      .fn<ChannelConnectionRepository['saveSettings']>()
      .mockResolvedValue(connectionRecord()),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new ConnectionRulesService(
    connections as unknown as ChannelConnectionsService,
    records as unknown as ChannelConnectionRepository,
    activity,
  );
  return { service, records, activity };
}

describe('ConnectionRulesService', () => {
  it('saves the pricing rule next to the selection and logs it in words', async () => {
    const { service, records, activity } = setup();

    await service.updatePricing(WORKSPACE_ID, CONNECTION_ID, RULE, ACTOR);

    expect(records.saveSettings).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, {
      account: null,
      productSelection: SELECTION,
      pricing: RULE,
    });
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
    expect(records.saveSettings).not.toHaveBeenCalled();
  });

  it('replaces or clears the selection, keeping the pricing rule', async () => {
    const { service, records, activity } = setup();

    await service.updateSelection(WORKSPACE_ID, CONNECTION_ID, null, ACTOR);

    expect(records.saveSettings.mock.calls[0]?.[2]).toMatchObject({ productSelection: null });
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ChannelSelectionUpdated,
      detail: 'every product',
    });
  });

  it('is not found when the connection is not in the workspace', async () => {
    const { service, records } = setup();
    records.saveSettings.mockResolvedValue(null);

    await expect(
      service.updateSelection(WORKSPACE_ID, CONNECTION_ID, SELECTION, ACTOR),
    ).rejects.toThrow(NotFoundException);
  });
});
