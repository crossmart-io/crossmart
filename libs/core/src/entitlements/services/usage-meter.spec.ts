import { AI_CREDITS_PER_CALL } from '../entitlements.constants.js';
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
    countAiCalls: vi.fn<UsageRepository['countAiCalls']>().mockResolvedValue(7),
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
      [Feature.AiCredits]: 7,
      [Feature.AutonomousAgents]: null,
      [Feature.BringYourOwnKey]: null,
    });
    expect(usage.countActiveListings).toHaveBeenCalledTimes(1);
    expect(usage.countActiveApiKeys).toHaveBeenCalledWith(SCOPE, expect.any(Date));
  });

  it('meters one AI credit per call made this UTC month', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-20T08:00:00Z') });
    const { meter, usage } = setup();

    await expect(meter.count(SCOPE, Feature.AiCredits)).resolves.toBe(7 * AI_CREDITS_PER_CALL);

    expect(usage.countAiCalls).toHaveBeenCalledWith(SCOPE, {
      from: new Date('2026-11-01T00:00:00Z'),
      to: new Date('2026-12-01T00:00:00Z'),
    });
    vi.useRealTimers();
  });
});
