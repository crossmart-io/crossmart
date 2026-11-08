import { Injectable } from '@nestjs/common';
import type { AgentWorkerAction } from '@crossmart/database';
import { AGENT_WORKER_TOOL_RESULT_MAX_LENGTH } from '../agent-worker.constants.js';
import type { AgentWorkerRun } from '../entities/agent-worker-run.js';
import { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';
import { AgentWorkerEventType } from '../enums/agent-worker-event-type.enum.js';
import { toActionView } from '../mappers/agent-worker.mapper.js';
import { AgentWorkerActionRepository } from '../repositories/agent-worker-action.repository.js';
import { truncateWithNote } from '../rules/truncate-text.js';
import { AgentWorkerToolbox } from '../tools/agent-worker-toolbox.js';
import { AgentWorkerToolCalls } from './agent-worker-tool-calls.js';

const TOOL_GONE = 'This tool is no longer available, so the change was not made.';

/** The person's decision, split: changes to make and changes to drop. */
export interface AgentWorkerDecision {
  approved: AgentWorkerAction[];
  rejected: AgentWorkerAction[];
}

/**
 * Applies a person's decision on proposed changes. Each action is claimed with a conditional
 * update first, so a change is made once even if two decisions race. Approved changes run
 * through the API with the person's current permissions, as "Agent Worker on behalf of" them;
 * a refusal (such as a read-only subscription or a permission the person lacks) is recorded,
 * not hidden.
 */
@Injectable()
export class AgentWorkerDecisions {
  constructor(
    private readonly actions: AgentWorkerActionRepository,
    private readonly toolbox: AgentWorkerToolbox,
    private readonly toolCalls: AgentWorkerToolCalls,
  ) {}

  /** Returns how many approved changes were attempted. */
  async apply(run: AgentWorkerRun, decision: AgentWorkerDecision): Promise<number> {
    const rejectedIds = decision.rejected.map((action) => action.id);
    await this.actions.decide(rejectedIds, AgentWorkerActionStatus.Rejected, run.scope.userId);
    await Promise.all(rejectedIds.map((id) => this.emit(run, id)));
    let attempted = 0;
    for (const action of decision.approved) {
      if (run.signal.aborted) {
        await this.actions.decide([action.id], AgentWorkerActionStatus.Cancelled, run.scope.userId);
      } else if (await this.execute(run, action)) {
        attempted += 1;
      }
      await this.emit(run, action.id);
    }
    return attempted;
  }

  private async execute(run: AgentWorkerRun, action: AgentWorkerAction): Promise<boolean> {
    const claimed = await this.actions.decide(
      [action.id],
      AgentWorkerActionStatus.Executing,
      run.scope.userId,
    );
    if (claimed === 0) return false;
    const tool = this.toolbox.find(action.toolName);
    const result = tool
      ? await this.toolCalls.execute(run.scope, tool, action.input as Record<string, unknown>)
      : { isError: true, text: TOOL_GONE };
    await this.actions.finish(action.id, {
      status: result.isError
        ? AgentWorkerActionStatus.ExecutionFailed
        : AgentWorkerActionStatus.Executed,
      result: truncateWithNote(result.text, AGENT_WORKER_TOOL_RESULT_MAX_LENGTH),
      resultIsError: result.isError,
    });
    return true;
  }

  private async emit(run: AgentWorkerRun, actionId: string): Promise<void> {
    const action = await this.actions.findById(actionId);
    if (!action) return;
    const titleOf = (name: string): string => this.toolbox.titleOf(name);
    run.sink.emit({
      type: AgentWorkerEventType.ActionDecided,
      action: toActionView(action, titleOf),
    });
  }
}
