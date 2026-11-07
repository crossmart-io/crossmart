import { Injectable, Logger } from '@nestjs/common';
import { describeError } from '@crossmart/common';
import type { ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import type { AgentWorkerScope } from '../entities/agent-worker-owner.js';
import type { AgentWorkerActionPreview } from '../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from '../previews/action-preview-formatter.js';
import { ACTION_PREVIEW_FORMATTERS } from '../previews/formatters/index.js';
import { PreviewReader } from '../previews/preview-reader.js';
import { change, humanize } from '../previews/preview-values.js';
import { AgentToolExecutor } from '../tools/agent-tool-executor.js';

const ID_SUFFIX = 'Id';

/** For a tool without a formatter: its title, and the values the call sets, ids aside. */
export function genericPreview(
  spec: ApiToolSpec,
  input: Record<string, unknown>,
): AgentWorkerActionPreview {
  const changes = Object.entries(input)
    .filter(([field]) => !field.endsWith(ID_SUFFIX))
    .flatMap(([field, value]) => change(humanize(field), null, value));
  return { target: null, headline: spec.title, details: [], changes };
}

/**
 * Shows what a proposed change would do before anyone approves it, in plain words: each write
 * tool has a formatter that reads the current values through the API and describes the change.
 * A preview that cannot be read falls back to the generic view; it never blocks the proposal.
 */
@Injectable()
export class AgentWorkerPreviewer {
  private readonly logger = new Logger(AgentWorkerPreviewer.name);
  private readonly formatters = new Map<string, ActionPreviewFormatter>(
    ACTION_PREVIEW_FORMATTERS.map((formatter) => [formatter.tool, formatter]),
  );

  constructor(private readonly executor: AgentToolExecutor) {}

  /** Whether the tool has its own plain-words preview. */
  hasFormatter(toolName: string): boolean {
    return this.formatters.has(toolName);
  }

  async preview(
    scope: AgentWorkerScope,
    spec: ApiToolSpec,
    input: Record<string, unknown>,
  ): Promise<AgentWorkerActionPreview> {
    const formatter = this.formatters.get(spec.name);
    if (!formatter) return genericPreview(spec, input);
    try {
      return await formatter.preview(input, new PreviewReader(this.executor, scope));
    } catch (error) {
      this.logger.warn(`Could not preview ${spec.name}: ${describeError(error)}`);
      return genericPreview(spec, input);
    }
  }
}
