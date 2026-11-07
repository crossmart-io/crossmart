import type { Job } from 'bullmq';
import {
  AGENT_CLIENT_SWEEP_JOB_NAME,
  type AgentClientSweeper,
  ASK_RETENTION_JOB_NAME,
  type AskRetentionService,
  SANDBOX_SWEEP_JOB_NAME,
  type SandboxSweeper,
} from '@crossmart/core';
import { MaintenanceProcessor } from './maintenance.processor.js';

function setup() {
  const agentClients = {
    sweep: vi.fn<AgentClientSweeper['sweep']>(() => Promise.resolve({ neverUsed: 0, stale: 0 })),
  };
  const sandboxes = {
    sweep: vi.fn<SandboxSweeper['sweep']>(() => Promise.resolve({ reminded: 1, deleted: 2 })),
  };
  const askRetention = {
    purge: vi.fn<AskRetentionService['purge']>(() => Promise.resolve(4)),
  };
  const processor = new MaintenanceProcessor(
    agentClients as unknown as AgentClientSweeper,
    sandboxes as unknown as SandboxSweeper,
    askRetention as unknown as AskRetentionService,
  );
  return { agentClients, sandboxes, askRetention, processor };
}

describe('MaintenanceProcessor', () => {
  it('sweeps unused agent clients', async () => {
    const { agentClients, sandboxes, processor } = setup();
    await processor.process({ name: AGENT_CLIENT_SWEEP_JOB_NAME } as Job);
    expect(agentClients.sweep).toHaveBeenCalled();
    expect(sandboxes.sweep).not.toHaveBeenCalled();
  });

  it('sweeps sandbox accounts', async () => {
    const { agentClients, sandboxes, processor } = setup();
    await processor.process({ name: SANDBOX_SWEEP_JOB_NAME } as Job);
    expect(sandboxes.sweep).toHaveBeenCalled();
    expect(agentClients.sweep).not.toHaveBeenCalled();
  });

  it('purges Ask Crossmart conversations past their retention', async () => {
    const { agentClients, askRetention, processor } = setup();
    await processor.process({ name: ASK_RETENTION_JOB_NAME } as Job);
    expect(askRetention.purge).toHaveBeenCalled();
    expect(agentClients.sweep).not.toHaveBeenCalled();
  });

  it('skips jobs it does not know', async () => {
    const { agentClients, sandboxes, processor } = setup();
    await processor.process({ name: 'something-else' } as Job);
    expect(agentClients.sweep).not.toHaveBeenCalled();
    expect(sandboxes.sweep).not.toHaveBeenCalled();
  });
});
