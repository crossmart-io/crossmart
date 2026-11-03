import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import {
  CONNECTION_ID,
  type ConnectorDouble,
  syncConnection,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import type { ProductSelectionService } from './product-selection.service.js';
import { SyncPlanner } from './sync-planner.js';

describe('SyncPlanner', () => {
  it('publishes every selected product and delists listed products that are not selected', async () => {
    const selection = {
      async *selectedIds() {
        yield ['p1', 'p2'];
        yield ['p3'];
      },
    };
    const listings = {
      createPending: vi.fn<ListingSyncRepository['createPending']>().mockResolvedValue(),
      listProductIdsOnChannel: vi
        .fn<ListingSyncRepository['listProductIdsOnChannel']>()
        .mockResolvedValue(['p2', 'old']),
    };
    const planner = new SyncPlanner(
      selection as unknown as ProductSelectionService,
      listings as unknown as ListingSyncRepository,
    );

    const plan = await planner.plan(WORKSPACE_ID, syncConnection({} as ConnectorDouble));

    expect(plan.publish.map((job) => job.productId)).toEqual(['p1', 'p2', 'p3']);
    expect(plan.publish.every((job) => job.kind === SyncJobKind.Content)).toBe(true);
    expect(plan.delist).toEqual([
      {
        kind: SyncJobKind.Delist,
        workspaceId: WORKSPACE_ID,
        connectionId: CONNECTION_ID,
        productId: 'old',
      },
    ]);
    expect(listings.createPending.mock.calls.map(([, , ids]) => ids)).toEqual([
      ['p1', 'p2'],
      ['p3'],
    ]);
  });
});
