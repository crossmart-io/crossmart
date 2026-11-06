import { Feature } from '../enums/feature.enum.js';
import type { PlanCatalogRepository } from '../repositories/plan-catalog.repository.js';
import { PlanCatalogService } from './plan-catalog.service.js';

function setup(records: Awaited<ReturnType<PlanCatalogRepository['findOffered']>>) {
  const repository = { findOffered: vi.fn().mockResolvedValue(records) };
  return new PlanCatalogService(repository as unknown as PlanCatalogRepository);
}

describe('PlanCatalogService', () => {
  it('lists offered plans at their latest version with what each grants', async () => {
    const service = setup([
      {
        code: 'alpha',
        name: 'Alpha',
        versions: [
          {
            version: 2,
            features: [{ feature: Feature.ActiveListings, enabled: true, limit: 500 }],
          },
        ],
      },
    ]);

    const [plan] = await service.listOffered();

    expect(plan).toMatchObject({ code: 'alpha', name: 'Alpha', version: 2 });
    expect(plan.grants.get(Feature.ActiveListings)).toMatchObject({ enabled: true, limit: 500 });
    expect(plan.grants.get(Feature.Workspaces)).toMatchObject({ enabled: false });
  });

  it('leaves out a plan that has no version yet', async () => {
    const service = setup([{ code: 'empty', name: 'Empty', versions: [] }]);

    expect(await service.listOffered()).toEqual([]);
  });
});
