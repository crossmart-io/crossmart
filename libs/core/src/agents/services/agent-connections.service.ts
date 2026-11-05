import { Injectable, NotFoundException } from '@nestjs/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { AgentConnection, AgentConnectionViewer } from '../entities/agent-connection.js';
import { parseAgentScopes } from '../permissions/agent-scope-permissions.js';
import {
  AgentConnectionRepository,
  type AgentConsentRecord,
} from '../repositories/agent-connection.repository.js';
import { agentClientName } from '../rules/agent-client-name.js';

/**
 * The agents connected to a workspace. Members see and revoke their own; those who manage API
 * keys see and revoke everyone's.
 */
@Injectable()
export class AgentConnectionsService {
  constructor(
    private readonly connections: AgentConnectionRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  async list(workspaceId: string, viewer: AgentConnectionViewer): Promise<AgentConnection[]> {
    const records = await this.connections.list(
      workspaceId,
      viewer.managesAll ? undefined : viewer.userId,
    );
    return records.flatMap((record) => {
      const connection = this.toConnection(record);
      return connection ? [connection] : [];
    });
  }

  async revoke(
    workspaceId: string,
    connectionId: string,
    viewer: AgentConnectionViewer,
    actor: Actor,
  ): Promise<void> {
    const record = await this.connections.findById(workspaceId, connectionId);
    if (!record?.userId || (!viewer.managesAll && record.userId !== viewer.userId)) {
      throw new NotFoundException('Agent connection not found');
    }
    await this.connections.revoke(
      { userId: record.userId, clientId: record.clientId, workspaceId },
      new Date(),
    );
    await this.activity.record(workspaceId, actor, {
      action: ActivityAction.AgentDisconnected,
      subject: {
        type: ActivitySubjectType.AgentConnection,
        id: record.id,
        label: agentClientName(record.clientId, record.client.name),
      },
    });
  }

  /** Null for a consent without a user, which agents never hold. */
  private toConnection(record: AgentConsentRecord): AgentConnection | null {
    if (!record.userId || !record.user) return null;
    return {
      id: record.id,
      clientId: record.clientId,
      clientName: agentClientName(record.clientId, record.client.name),
      clientUri: record.client.uri,
      clientIcon: record.client.icon,
      userId: record.userId,
      userName: record.user.name,
      userEmail: record.user.email,
      scopes: parseAgentScopes(record.scopes),
      connectedAt: record.createdAt,
    };
  }
}
