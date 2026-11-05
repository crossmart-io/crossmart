import { HttpStatus } from '@nestjs/common';
import { Actor } from '../../activity/entities/actor.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { channelProductStateWhere } from '../rules/channel-product-state-where.js';
import { CONNECTION_ID, connectionView, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import type { ActiveListingsGate } from './active-listings.gate.js';
import type { ConnectionRulesService } from './connection-rules.service.js';
import type { SelectionApplier } from './selection-applier.js';
import { StoreSelectionService } from './store-selection.service.js';

const ACTOR = Actor.user('user-1');
const STORE = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID };
const RULE = { filter: {}, includeProductIds: [], excludeProductIds: [] };

function setup() {
  const rules = {
    updateSelection: vi
      .fn<ConnectionRulesService['updateSelection']>()
      .mockResolvedValue(connectionView()),
  };
  const applier = {
    applySelection: vi
      .fn<SelectionApplier['applySelection']>()
      .mockResolvedValue({ queued: 2, delisting: 0 }),
  };
  const gate = { assertRoomFor: vi.fn<ActiveListingsGate['assertRoomFor']>().mockResolvedValue() };
  const service = new StoreSelectionService(
    rules as unknown as ConnectionRulesService,
    applier as unknown as SelectionApplier,
    gate as unknown as ActiveListingsGate,
  );
  return { service, rules, applier, gate };
}

describe('StoreSelectionService', () => {
  it('checks what the new rule would publish, then saves and applies it', async () => {
    const { service, rules, applier, gate } = setup();

    await service.update(STORE, RULE, ACTOR);

    expect(gate.assertRoomFor).toHaveBeenCalledWith(
      STORE,
      channelProductStateWhere({ ...STORE, rule: RULE }, ChannelProductState.Pending),
    );
    expect(rules.updateSelection).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, RULE, ACTOR);
    expect(applier.applySelection).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID);
  });

  it('saves nothing when the plan has no room for what the rule adds', async () => {
    const { service, rules, applier, gate } = setup();
    gate.assertRoomFor.mockRejectedValueOnce(planLimitReached(Feature.ActiveListings));

    await expect(service.update(STORE, RULE, ACTOR)).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
    });
    expect(rules.updateSelection).not.toHaveBeenCalled();
    expect(applier.applySelection).not.toHaveBeenCalled();
  });
});
