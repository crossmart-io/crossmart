import { NotFoundException } from '@nestjs/common';
import { AgentClientRegistration } from '../enums/agent-client-registration.enum.js';
import type { AgentClientRepository } from '../repositories/agent-client.repository.js';
import { AgentClientsService } from './agent-clients.service.js';

function serviceFinding(client: unknown) {
  const clients = { findEnabled: vi.fn().mockResolvedValue(client) };
  return new AgentClientsService(clients as unknown as AgentClientRepository);
}

describe('AgentClientsService', () => {
  it('describes an agent and how far it can be trusted', async () => {
    const service = serviceFinding({
      clientId: 'dcr-1',
      name: 'Claude',
      uri: 'https://claude.ai',
      clientDiscoveryId: null,
    });

    await expect(service.findProfile('dcr-1')).resolves.toMatchObject({
      name: 'Claude',
      registration: AgentClientRegistration.Dynamic,
      claimedHost: 'claude.ai',
    });
  });

  it('answers not found for an unknown or disabled agent', async () => {
    await expect(serviceFinding(null).findProfile('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
