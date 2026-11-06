import { Module } from '@nestjs/common';
import { AgentsModule, TenancyModule } from '@crossmart/core';
import { AuthModule } from '../auth/auth.module.js';
import { AgentAuthorizationController } from './controllers/agent-authorization.controller.js';
import { AgentConnectionsController } from './controllers/agent-connections.controller.js';

/** AI agents connected with OAuth: picking their workspace, and managing connections. */
@Module({
  imports: [AgentsModule, AuthModule, TenancyModule],
  controllers: [AgentAuthorizationController, AgentConnectionsController],
})
export class AgentsApiModule {}
