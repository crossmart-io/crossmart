import { Feature } from '../enums/feature.enum.js';
import type { OrganizationScope, UsageRepository } from '../repositories/usage.repository.js';
import { UsageMeter } from './usage-meter.js';

const SCOPE: OrganizationScope = { organizationId: 'org-1', workspaceIds: ['ws-1', 'ws-2'] };

function setup() {
  const usage = {
    countActiveListings: vi.fn<UsageRepository['countActiveListings']>().mockResolvedValue(40),
    countChannelConnections: vi
      .fn<UsageRepository['countChannelConnections']>()
      .mockResolvedValue(3),
    countMembers: vi.fn<UsageRepository['countMembers']>().mockResolvedValue(5),
    countActiveApiKeys: vi.fn<UsageRepository['countActiveApiKeys']>().mockResolvedValue(1),
  };
  return { meter: new UsageMeter(usage as unknown as UsageRepository), usage };
}

describe('UsageMeter', () => {
  it('counts each feature from the data, in parallel', async () => {
    const { meter, usage } = setup();
    const counts = await meter.countAll(SCOPE, Object.values(Feature));
    expect(Object.fromEntries(counts)).toEqual({
      [Feature.ActiveListings]: 40,
      [Feature.ChannelConnections]: 3,
      [Feature.Workspaces]: 2,
      [Feature.Members]: 5,
      [Feature.ApiKeys]: 1,
      [Feature.AiCredits]: 0,
      [Feature.AutonomousAgents]: null,
      [Feature.BringYourOwnKey]: null,
    });
    expect(usage.countActiveListings).toHaveBeenCalledTimes(1);
    expect(usage.countActiveApiKeys).toHaveBeenCalledWith(SCOPE, expect.any(Date));
  });

  it('meters no AI credits until AI usage is recorded', async () => {
    const { meter } = setup();
    await expect(meter.count(SCOPE, Feature.AiCredits)).resolves.toBe(0);
  });
});
