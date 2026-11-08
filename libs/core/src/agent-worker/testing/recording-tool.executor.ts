import type { ApiToolResult, ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import { JSON_INDENTATION } from '../../agent-tools/agent-tools.constants.js';
import type { AgentWorkerScope } from '../entities/agent-worker-owner.js';
import { AgentToolExecutor } from '../tools/agent-tool-executor.js';

/** A call the executor received. */
export interface RecordedToolCall {
  scope: AgentWorkerScope;
  toolName: string;
  input: Record<string, unknown>;
}

/**
 * An `AgentToolExecutor` that records every call and answers from a script per tool, for tests.
 * A tool without an answer gets `{ items: [] }`.
 */
export class RecordingToolExecutor extends AgentToolExecutor {
  readonly calls: RecordedToolCall[] = [];
  private readonly answers = new Map<string, ApiToolResult>();

  answer(toolName: string, value: unknown): this {
    this.answers.set(toolName, {
      isError: false,
      text: JSON.stringify(value, null, JSON_INDENTATION),
      value,
    });
    return this;
  }

  refuse(toolName: string, text: string, status: number): this {
    this.answers.set(toolName, { isError: true, text, status });
    return this;
  }

  callsTo(toolName: string): RecordedToolCall[] {
    return this.calls.filter((call) => call.toolName === toolName);
  }

  execute(
    scope: AgentWorkerScope,
    spec: ApiToolSpec,
    input: Record<string, unknown>,
  ): Promise<ApiToolResult> {
    this.calls.push({ scope, toolName: spec.name, input });
    const value = { items: [] };
    return Promise.resolve(
      this.answers.get(spec.name) ?? { isError: false, text: JSON.stringify(value), value },
    );
  }
}
