import { Injectable, Logger } from '@nestjs/common';
import { describeError } from '@crossmart/common';
import type { AgentWorkerAction } from '@crossmart/database';
import type { ApiToolResult } from '../../agent-tools/tools/api-tool.js';
import type { AiToolUseBlock } from '../../ai/entities/ai-conversation.js';
import { AGENT_WORKER_TOOL_RESULT_MAX_LENGTH } from '../agent-worker.constants.js';
import type { AgentWorkerScope } from '../entities/agent-worker-owner.js';
import type { AgentWorkerRun } from '../entities/agent-worker-run.js';
import { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';
import { AgentWorkerEventType } from '../enums/agent-worker-event-type.enum.js';
import { AgentWorkerToolKind } from '../enums/agent-worker-tool-kind.enum.js';
import { toActionView } from '../mappers/agent-worker.mapper.js';
import {
  AgentWorkerActionRepository,
  type NewAgentWorkerAction,
} from '../repositories/agent-worker-action.repository.js';
import { assessRisks } from '../rules/action-risk.js';
import { truncateWithNote } from '../rules/truncate-text.js';
import { looksLikeInstructions } from '../rules/untrusted-text.js';
import { AgentToolExecutor } from '../tools/agent-tool-executor.js';
import type { AgentWorkerTool } from '../tools/agent-worker-toolbox.js';
import { AgentWorkerPreviewer } from './agent-worker-previewer.js';
import { AgentWorkerWriteGate } from './agent-worker-write-gate.js';

/** One tool use of a model answer, checked against the tools offered. */
interface ToolCall {
  run: AgentWorkerRun;
  messageId: string;
  use: AiToolUseBlock;
  tool?: AgentWorkerTool;
  input: Record<string, unknown>;
  /** Why it cannot run or be proposed; absent when it can. */
  refusal?: string;
}

/** A call's place in its answer: how many listings the answer's changes publish together. */
interface BatchFacts {
  publishesInBatch: number;
  /** Why changes are refused now (a read-only subscription), or null. */
  writeRefusal: string | null;
}

type BaseAction = Omit<NewAgentWorkerAction, 'status'>;

const UNREACHABLE = 'Crossmart could not be reached for this call. Try again later.';
const ISSUE_SEPARATOR = ', ';
const PATH_SEPARATOR = '.';
const ROOT_PATH = '(root)';

function unknownTool(name: string): string {
  return `There is no tool named ${name} that this person may use. Use only the tools offered.`;
}

function isWrite(call: ToolCall): boolean {
  return call.tool?.kind === AgentWorkerToolKind.Write;
}

/**
 * What happens to the tool calls of one model answer. Reads run at once, through the API. Writes
 * never run here: each becomes a proposal with its risks and a before-and-after preview, for the
 * person to approve or reject. A call to an unknown tool, with invalid input, or while the
 * workspace is read-only, is refused and the model is told why.
 */
@Injectable()
export class AgentWorkerToolCalls {
  private readonly logger = new Logger(AgentWorkerToolCalls.name);

  constructor(
    private readonly actions: AgentWorkerActionRepository,
    private readonly executor: AgentToolExecutor,
    private readonly previewer: AgentWorkerPreviewer,
    private readonly writeGate: AgentWorkerWriteGate,
  ) {}

  /** Handles the calls in order; returns how many changes now wait for approval. */
  async handle(run: AgentWorkerRun, messageId: string, uses: AiToolUseBlock[]): Promise<number> {
    const calls = uses.map((use) => this.prepare(run, messageId, use));
    const facts = await this.batchFacts(run, calls);
    let proposed = 0;
    for (const call of calls) {
      proposed += await this.handleOne(call, facts);
    }
    return proposed;
  }

  /** Runs a call through the API; an unreachable API is a failed call, not a failed turn. */
  async execute(
    scope: AgentWorkerScope,
    tool: AgentWorkerTool,
    input: Record<string, unknown>,
  ): Promise<ApiToolResult> {
    try {
      return await this.executor.execute(scope, tool.spec, input);
    } catch (error) {
      this.logger.warn(`Agent Worker could not call ${tool.spec.name}: ${describeError(error)}`);
      return { isError: true, text: UNREACHABLE };
    }
  }

  private async handleOne(call: ToolCall, facts: BatchFacts): Promise<number> {
    const refusal = call.refusal ?? (isWrite(call) ? facts.writeRefusal : null);
    if (call.run.signal.aborted) {
      await this.record(call, AgentWorkerActionStatus.Cancelled, null);
      return 0;
    }
    if (refusal || !call.tool) {
      await this.record(call, AgentWorkerActionStatus.Refused, refusal ?? '');
      return 0;
    }
    if (call.tool.kind === AgentWorkerToolKind.Read) {
      await this.read(call, call.tool);
      return 0;
    }
    await this.propose(call, call.tool, facts.publishesInBatch);
    return 1;
  }

  private async batchFacts(run: AgentWorkerRun, calls: ToolCall[]): Promise<BatchFacts> {
    const valid = calls.filter((call) => !call.refusal);
    const writeRefusal = valid.some(isWrite)
      ? await this.writeGate.refusal(run.scope.workspaceId)
      : null;
    return {
      publishesInBatch: valid.filter((call) => call.tool?.spec.publishes).length,
      writeRefusal,
    };
  }

  private prepare(run: AgentWorkerRun, messageId: string, use: AiToolUseBlock): ToolCall {
    const base = { run, messageId, use, input: use.input };
    const tool = run.tools.find((candidate) => candidate.spec.name === use.name);
    if (!tool) return { ...base, refusal: unknownTool(use.name) };
    const parsed = tool.schema.safeParse(use.input);
    if (parsed.success) return { ...base, tool, input: parsed.data };
    const paths = parsed.error.issues.map((issue) => issue.path.join(PATH_SEPARATOR) || ROOT_PATH);
    const where = [...new Set(paths)].join(ISSUE_SEPARATOR);
    return { ...base, tool, refusal: `The input does not match the tool's schema at ${where}.` };
  }

  private async record(
    call: ToolCall,
    status: AgentWorkerActionStatus,
    result: string | null,
  ): Promise<void> {
    const action = await this.actions.create({
      ...this.baseOf(call),
      status,
      result,
      resultIsError: true,
    });
    this.emit(call, AgentWorkerEventType.ToolFinished, action);
  }

  private async read(call: ToolCall, tool: AgentWorkerTool): Promise<void> {
    const started = await this.actions.create({
      ...this.baseOf(call),
      status: AgentWorkerActionStatus.Running,
    });
    this.emit(call, AgentWorkerEventType.ToolStarted, started);
    const result = await this.execute(call.run.scope, tool, call.input);
    if (looksLikeInstructions(result.text)) call.run.untrustedSeen = true;
    const finished = await this.actions.finish(started.id, {
      status: result.isError ? AgentWorkerActionStatus.Failed : AgentWorkerActionStatus.Succeeded,
      result: truncateWithNote(result.text, AGENT_WORKER_TOOL_RESULT_MAX_LENGTH),
      resultIsError: result.isError,
    });
    this.emit(call, AgentWorkerEventType.ToolFinished, finished);
  }

  private async propose(
    call: ToolCall,
    tool: AgentWorkerTool,
    publishesInBatch: number,
  ): Promise<void> {
    const preview = await this.previewer.preview(call.run.scope, tool.spec, call.input);
    const action = await this.actions.create({
      ...this.baseOf(call),
      status: AgentWorkerActionStatus.Proposed,
      summary: preview.target ? `${tool.spec.title}: ${preview.target}` : tool.spec.title,
      risks: assessRisks({ spec: tool.spec, input: call.input, publishesInBatch, preview }),
      preview,
      untrustedWarning: call.run.untrustedSeen,
    });
    this.emit(call, AgentWorkerEventType.ActionProposed, action);
  }

  private emit(call: ToolCall, type: AgentWorkerEventType, action: AgentWorkerAction): void {
    const title = call.tool?.spec.title ?? call.use.name;
    call.run.sink.emit({ type, action: toActionView(action, () => title) });
  }

  private baseOf(call: ToolCall): BaseAction {
    return {
      conversationId: call.run.scope.conversationId,
      messageId: call.messageId,
      toolUseId: call.use.id,
      toolName: call.use.name,
      kind: call.tool?.kind ?? AgentWorkerToolKind.Write,
      input: call.input,
      summary: call.tool?.spec.title ?? call.use.name,
    };
  }
}
