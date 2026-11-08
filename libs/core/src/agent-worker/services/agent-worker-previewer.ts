import { Injectable } from '@nestjs/common';
import type { ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import type { AgentWorkerScope } from '../entities/agent-worker-owner.js';
import type { AgentWorkerActionPreview } from '../entities/agent-worker-views.js';
import { ToolCallPreviewer } from '../previews/tool-call-previewer.js';
import { AgentToolExecutor } from '../tools/agent-tool-executor.js';

export { genericPreview } from '../previews/tool-call-previewer.js';

/**
 * Crossmart Agent's previews: the shared formatters (`ToolCallPreviewer`), reading the current
 * values through the API as the person the conversation belongs to.
 */
@Injectable()
export class AgentWorkerPreviewer {
  private readonly previewer = new ToolCallPreviewer();

  constructor(private readonly executor: AgentToolExecutor) {}

  /** Whether the tool has its own plain-words preview. */
  hasFormatter(toolName: string): boolean {
    return this.previewer.hasFormatter(toolName);
  }

  preview(
    scope: AgentWorkerScope,
    spec: ApiToolSpec,
    input: Record<string, unknown>,
  ): Promise<AgentWorkerActionPreview> {
    return this.previewer.preview(spec, input, (toolSpec, toolInput) =>
      this.executor.execute(scope, toolSpec, toolInput),
    );
  }
}
