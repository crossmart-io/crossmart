import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import type { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import { goingLiveWhere } from '../rules/listing-visibility.js';
import { ActiveListingsGate } from './active-listings.gate.js';

const STORE = { workspaceId: 'ws-1', connectionId: 'conn-1' };
const SELECTED = { workspaceId: 'ws-1', tags: { has: 'sale' } };

function setup(enforced = true, goingLive = 3) {
  const products = {
    count: vi.fn<ProductSelectionRepository['count']>().mockResolvedValue(goingLive),
  };
  const entitlements = {
    enforced,
    assertInWorkspace: vi.fn<EntitlementService['assertInWorkspace']>().mockResolvedValue(),
    violationInWorkspace: vi
      .fn<EntitlementService['violationInWorkspace']>()
      .mockResolvedValue(null),
  };
  const gate = new ActiveListingsGate(
    products as unknown as ProductSelectionRepository,
    entitlements as unknown as EntitlementService,
  );
  return { gate, products, entitlements };
}

describe('ActiveListingsGate', () => {
  it('asks the plan for room for every listing a publish would make live', async () => {
    const { gate, products, entitlements } = setup();
    await gate.assertRoomFor(STORE, SELECTED);
    expect(products.count).toHaveBeenCalledWith(goingLiveWhere('conn-1', SELECTED));
    expect(entitlements.assertInWorkspace).toHaveBeenCalledWith('ws-1', Feature.ActiveListings, 3);
  });

  it('passes on the refusal, so the caller changes nothing', async () => {
    const { gate, entitlements } = setup();
    entitlements.assertInWorkspace.mockRejectedValueOnce(planLimitReached(Feature.ActiveListings));
    await expect(gate.assertRoomFor(STORE, SELECTED)).rejects.toThrow(/active listings/);
  });

  it('asks nothing when no listing would go live, or while plans are not enforced', async () => {
    const none = setup(true, 0);
    await none.gate.assertRoomFor(STORE, SELECTED);
    expect(none.entitlements.assertInWorkspace).not.toHaveBeenCalled();

    const unenforced = setup(false);
    await unenforced.gate.assertRoomFor(STORE, SELECTED);
    expect(unenforced.products.count).not.toHaveBeenCalled();
  });

  it('asks for one more listing for the worker', async () => {
    const { gate, entitlements } = setup();
    await expect(gate.refusalForOneMore('ws-1')).resolves.toBeNull();
    expect(entitlements.violationInWorkspace).toHaveBeenCalledWith('ws-1', Feature.ActiveListings);
  });
});
