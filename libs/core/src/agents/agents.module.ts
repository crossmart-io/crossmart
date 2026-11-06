import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { AgentClientRepository } from './repositories/agent-client.repository.js';
import { AgentConnectionRepository } from './repositories/agent-connection.repository.js';
import { AgentAccessService } from './services/agent-access.service.js';
import { AgentClientSweeper } from './services/agent-client-sweeper.js';
import { AgentClientsService } from './services/agent-clients.service.js';
import { AgentConnectionsService } from './services/agent-connections.service.js';

/** AI agents connected to workspaces with OAuth (ADR 0019): who may act, and their connections. */
@Module({
  imports: [ActivityModule, TenancyModule],
  providers: [
    AgentClientRepository,
    AgentConnectionRepository,
    AgentAccessService,
    AgentClientSweeper,
    AgentClientsService,
    AgentConnectionsService,
  ],
  exports: [AgentAccessService, AgentClientSweeper, AgentClientsService, AgentConnectionsService],
})
export class AgentsModule {}
