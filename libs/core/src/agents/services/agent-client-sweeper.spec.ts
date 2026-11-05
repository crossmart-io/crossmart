import type { AgentConnectionRepository } from '../repositories/agent-connection.repository.js';
import { AgentClientSweeper } from './agent-client-sweeper.js';

describe('AgentClientSweeper', () => {
  it('deletes registrations unused for a day', async () => {
    const connections = { deleteUnusedRegistrations: vi.fn().mockResolvedValue(3) };
    const sweeper = new AgentClientSweeper(connections as unknown as AgentConnectionRepository);

    await expect(sweeper.sweep(new Date('2026-11-05T12:00:00Z'))).resolves.toBe(3);
    expect(connections.deleteUnusedRegistrations).toHaveBeenCalledWith(
      new Date('2026-11-04T12:00:00Z'),
    );
  });
});
