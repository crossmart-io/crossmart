import type { AgentToolName } from '../../agent-tools/agent-tools.constants.js';
import type { AgentWorkerActionPreview } from '../entities/agent-worker-views.js';
import type { PreviewReader } from './preview-reader.js';

/**
 * Describes one tool's proposed change in plain words for the approval card: a headline, the
 * values before and after, and anything else worth reading. Input has passed the tool's schema.
 */
export interface ActionPreviewFormatter {
  readonly tool: AgentToolName;
  preview(input: Record<string, unknown>, reader: PreviewReader): Promise<AgentWorkerActionPreview>;
}
