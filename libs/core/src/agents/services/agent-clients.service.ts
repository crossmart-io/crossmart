import { Injectable, NotFoundException } from '@nestjs/common';
import type { AgentClientProfile } from '../entities/agent-client-profile.js';
import { AgentClientRepository } from '../repositories/agent-client.repository.js';
import { toAgentClientProfile } from '../rules/agent-client-profile.js';

/** Who an agent asking for access is, and what of that Crossmart could check (ADR 0019). */
@Injectable()
export class AgentClientsService {
  constructor(private readonly clients: AgentClientRepository) {}

  async findProfile(clientId: string): Promise<AgentClientProfile> {
    const client = await this.clients.findEnabled(clientId);
    if (!client) throw new NotFoundException('Agent not found');
    return toAgentClientProfile(client);
  }
}
