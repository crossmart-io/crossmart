import type { AppConfigService } from '@crossmart/common';
import type { AccountProgress } from '../entities/getting-started.js';
import { GettingStartedStep } from '../enums/getting-started-step.enum.js';
import type { GettingStartedRepository } from '../repositories/getting-started.repository.js';
import { GettingStartedService } from './getting-started.service.js';

const PROGRESS: AccountProgress = {
  emailVerified: true,
  unclaimedSandbox: false,
  products: 0,
  connectedStores: 0,
  liveListings: 0,
  pendingProposals: 0,
  agentChangesNeedApproval: false,
};

describe('GettingStartedService', () => {
  it('reads the caller’s progress in the workspace and links steps to the web app', async () => {
    const progress = vi.fn<GettingStartedRepository['progress']>().mockResolvedValue(PROGRESS);
    const service = new GettingStartedService(
      { progress } as unknown as GettingStartedRepository,
      { webAppUrl: 'https://app.example' } as AppConfigService,
    );

    const view = await service.read('ws-1', 'user-1');

    expect(progress).toHaveBeenCalledWith('ws-1', 'user-1', expect.any(Date));
    expect(view.nextStep).toBe(GettingStartedStep.AddProducts);
    expect(view.connectStoreLinks[0]?.url).toBe('https://app.example/stores?connect=shopify');
  });
});
