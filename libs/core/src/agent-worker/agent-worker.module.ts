import { type DynamicModule, Module, type ModuleMetadata, type Type } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { AgentWorkerStorageModule } from './agent-worker-storage.module.js';
import { AgentWorkerActionRepository } from './repositories/agent-worker-action.repository.js';
import { AgentWorkerMessageRepository } from './repositories/agent-worker-message.repository.js';
import { AgentWorkerTurnRepository } from './repositories/agent-worker-turn.repository.js';
import { AgentWorkerCancellation } from './services/agent-worker-cancellation.js';
import { AgentWorkerConversationsService } from './services/agent-worker-conversations.service.js';
import { AgentWorkerDecisions } from './services/agent-worker-decisions.js';
import { AgentWorkerLoop } from './services/agent-worker-loop.js';
import { AgentWorkerPreviewer } from './services/agent-worker-previewer.js';
import { AgentWorkerToolCalls } from './services/agent-worker-tool-calls.js';
import { AgentWorkerStore } from './services/agent-worker-store.js';
import { AgentWorkerTurnRunner } from './services/agent-worker-turn-runner.js';
import { AgentWorkerTurnStarter } from './services/agent-worker-turn-starter.js';
import { AgentWorkerWriteGate } from './services/agent-worker-write-gate.js';
import { AgentToolExecutor } from './tools/agent-tool-executor.js';
import { AgentWorkerToolbox } from './tools/agent-worker-toolbox.js';

/** How the app running Agent Worker lets it call tools, and what that needs. */
export interface AgentWorkerModuleOptions {
  /** Runs tools through the API (the API app's loopback executor; a fake in tests). */
  executor: Type<AgentToolExecutor>;
  /** Modules the executor depends on. */
  imports?: ModuleMetadata['imports'];
}

/**
 * Agent Worker (ADR 0026): conversations with an AI agent that reads the workspace through the
 * same tools as the MCP server and proposes changes for the person to approve.
 */
@Module({})
export class AgentWorkerModule {
  static register(options: AgentWorkerModuleOptions): DynamicModule {
    return {
      module: AgentWorkerModule,
      imports: [
        AiModule,
        EntitlementsModule,
        TenancyModule,
        AgentWorkerStorageModule,
        ...(options.imports ?? []),
      ],
      providers: [
        { provide: AgentToolExecutor, useClass: options.executor },
        AgentWorkerMessageRepository,
        AgentWorkerActionRepository,
        AgentWorkerTurnRepository,
        AgentWorkerToolbox,
        AgentWorkerCancellation,
        AgentWorkerConversationsService,
        AgentWorkerPreviewer,
        AgentWorkerWriteGate,
        AgentWorkerToolCalls,
        AgentWorkerLoop,
        AgentWorkerDecisions,
        AgentWorkerStore,
        AgentWorkerTurnStarter,
        AgentWorkerTurnRunner,
      ],
      exports: [AgentWorkerConversationsService, AgentWorkerTurnStarter, AgentWorkerTurnRunner],
    };
  }
}
