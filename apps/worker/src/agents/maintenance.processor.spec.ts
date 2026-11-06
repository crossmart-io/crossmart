import type { Job } from 'bullmq';
import { AGENT_CLIENT_SWEEP_JOB_NAME, type AgentClientSweeper } from '@crossmart/core';
import { MaintenanceProcessor } from './maintenance.processor.js';

function setup() {
  const sweeper = {
    sweep: vi.fn<AgentClientSweeper['sweep']>(() => Promise.resolve({ neverUsed: 0, stale: 0 })),
  };
  return { sweeper, processor: new MaintenanceProcessor(sweeper as unknown as AgentClientSweeper) };
}

describe('MaintenanceProcessor', () => {
  it('sweeps unused agent clients', async () => {
    const { sweeper, processor } = setup();
    await processor.process({ name: AGENT_CLIENT_SWEEP_JOB_NAME } as Job);
    expect(sweeper.sweep).toHaveBeenCalled();
  });

  it('skips jobs it does not know', async () => {
    const { sweeper, processor } = setup();
    await processor.process({ name: 'something-else' } as Job);
    expect(sweeper.sweep).not.toHaveBeenCalled();
  });
});
