import { Injectable } from '@nestjs/common';
import { UNUSED_AGENT_CLIENT_TTL_MS } from '../agents.constants.js';
import { AgentConnectionRepository } from '../repositories/agent-connection.repository.js';

/**
 * Keeps open client registration from piling up (ADR 0019): deletes registrations that were
 * never used within a day. Clients identified by a metadata document are never touched.
 */
@Injectable()
export class AgentClientSweeper {
  constructor(private readonly connections: AgentConnectionRepository) {}

  /** Returns how many registrations were deleted. */
  sweep(now = new Date()): Promise<number> {
    return this.connections.deleteUnusedRegistrations(
      new Date(now.getTime() - UNUSED_AGENT_CLIENT_TTL_MS),
    );
  }
}
