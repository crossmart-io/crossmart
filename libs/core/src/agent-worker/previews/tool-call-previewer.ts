import { Logger } from '@nestjs/common';
import { describeError } from '@crossmart/common';
import type { ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import type { AgentWorkerActionPreview } from '../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from './action-preview-formatter.js';
import { ACTION_PREVIEW_FORMATTERS } from './formatters/index.js';
import { PreviewReader, type PreviewToolRunner } from './preview-reader.js';
import { change, humanize } from './preview-values.js';

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
 * Shows what a proposed tool call would do before anyone approves it, in plain words: each write
 * tool has a formatter that reads the current values through the API and describes the change.
 * Crossmart Agent and outside agents' proposals (ADR 0028) share it. A preview that cannot be
 * read falls back to the generic view; it never blocks the proposal.
 */
export class ToolCallPreviewer {
  private readonly logger = new Logger(ToolCallPreviewer.name);
  private readonly formatters = new Map<string, ActionPreviewFormatter>(
    ACTION_PREVIEW_FORMATTERS.map((formatter) => [formatter.tool, formatter]),
  );

  /** Whether the tool has its own plain-words preview. */
  hasFormatter(toolName: string): boolean {
    return this.formatters.has(toolName);
  }

  async preview(
    spec: ApiToolSpec,
    input: Record<string, unknown>,
    run: PreviewToolRunner,
  ): Promise<AgentWorkerActionPreview> {
    const formatter = this.formatters.get(spec.name);
    if (!formatter) return genericPreview(spec, input);
    try {
      return await formatter.preview(input, new PreviewReader(run));
    } catch (error) {
      this.logger.warn(`Could not preview ${spec.name}: ${describeError(error)}`);
      return genericPreview(spec, input);
    }
  }
}
