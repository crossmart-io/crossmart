import { Injectable } from '@nestjs/common';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import {
  AGENT_CLIENT_SWEEP_BATCH_SIZE,
  AGENT_CLIENT_SWEEP_MAX_BATCHES,
  REMOVED_AGENT_NAME_SEPARATOR,
  STALE_AGENT_CLIENT_TTL_MS,
  UNUSED_AGENT_CLIENT_TTL_MS,
} from '../agents.constants.js';
import type {
  AgentClientSweepResult,
  AgentClientWorkspace,
  StaleAgentClient,
} from '../entities/agent-client-sweep.js';
import { AgentClientRepository } from '../repositories/agent-client.repository.js';

/** The names of the removed clients, grouped by the workspaces they acted in. */
function namesByWorkspace(
  clients: StaleAgentClient[],
  actedIn: AgentClientWorkspace[],
): Map<string, string[]> {
  const nameOf = new Map(clients.map(({ clientId, name }) => [clientId, name]));
  const names = new Map<string, string[]>();
  for (const { clientId, workspaceId } of actedIn) {
    const name = nameOf.get(clientId);
    if (name) names.set(workspaceId, [...(names.get(workspaceId) ?? []), name]);
  }
  return names;
}

/**
 * Keeps OAuth clients from piling up (ADR 0019). Every hour it deletes self-registered clients
 * never used within a day, and clients of any kind (metadata document or self-registered) that
 * nobody used for `STALE_AGENT_CLIENT_TTL_MS`. A client a user still has connected, or that holds
 * a refresh token still valid, is never deleted. Running it twice deletes nothing more.
 */
@Injectable()
export class AgentClientSweeper {
  constructor(
    private readonly clients: AgentClientRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  async sweep(now = new Date()): Promise<AgentClientSweepResult> {
    const neverUsed = await this.clients.deleteUnusedRegistrations(
      new Date(now.getTime() - UNUSED_AGENT_CLIENT_TTL_MS),
    );
    const stale = await this.deleteStaleClients(now);
    return { neverUsed, stale };
  }

  /** In batches, until none is left or the sweep's batch budget is spent. */
  private async deleteStaleClients(now: Date): Promise<number> {
    const cutoff = new Date(now.getTime() - STALE_AGENT_CLIENT_TTL_MS);
    let deleted = 0;
    for (let batch = 0; batch < AGENT_CLIENT_SWEEP_MAX_BATCHES; batch += 1) {
      const clients = await this.clients.findStale(cutoff, now, AGENT_CLIENT_SWEEP_BATCH_SIZE);
      if (clients.length > 0) deleted += await this.deleteBatch(clients, cutoff, now);
      if (clients.length < AGENT_CLIENT_SWEEP_BATCH_SIZE) break;
    }
    return deleted;
  }

  private async deleteBatch(clients: StaleAgentClient[], cutoff: Date, now: Date): Promise<number> {
    const clientIds = clients.map(({ clientId }) => clientId);
    const actedIn = await this.clients.findWorkspacesActedIn(clientIds);
    const withActivity = new Set(actedIn.map(({ clientId }) => clientId));
    const deleted = await this.clients.deleteStale(clients, withActivity, cutoff, now);
    await this.recordRemovals(namesByWorkspace(clients, actedIn));
    return deleted;
  }

  /** One event per workspace the removed agents worked in, naming them. */
  private async recordRemovals(names: Map<string, string[]>): Promise<void> {
    for (const [workspaceId, agentNames] of names) {
      await this.activity.record(workspaceId, Actor.system(), {
        action: ActivityAction.UnusedAgentsRemoved,
        itemCount: agentNames.length,
        detail: agentNames.join(REMOVED_AGENT_NAME_SEPARATOR),
      });
    }
  }
}
