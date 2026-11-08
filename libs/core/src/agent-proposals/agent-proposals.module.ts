import { type DynamicModule, Module, type ModuleMetadata, type Type } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { WorkspaceSettingsModule } from '../workspace-settings/workspace-settings.module.js';
import { AgentProposalsStorageModule } from './agent-proposals-storage.module.js';
import { AgentProposalDecisions } from './services/agent-proposal-decisions.js';
import { AgentProposalExecutor } from './services/agent-proposal-executor.js';
import { AgentProposalsService } from './services/agent-proposals.service.js';

/** How the app deciding proposals applies them, and what that needs. */
export interface AgentProposalsModuleOptions {
  /** Applies an approved proposal through the API (the API app's loopback executor). */
  executor: Type<AgentProposalExecutor>;
  imports?: ModuleMetadata['imports'];
}

/**
 * Outside agents' changes that wait for the seller (ADR 0028): proposing, listing and deciding.
 */
@Module({})
export class AgentProposalsModule {
  static register(options: AgentProposalsModuleOptions): DynamicModule {
    return {
      module: AgentProposalsModule,
      imports: [
        ActivityModule,
        AgentProposalsStorageModule,
        WorkspaceSettingsModule,
        ...(options.imports ?? []),
      ],
      providers: [
        { provide: AgentProposalExecutor, useClass: options.executor },
        AgentProposalsService,
        AgentProposalDecisions,
      ],
      exports: [AgentProposalsService, AgentProposalDecisions],
    };
  }
}
