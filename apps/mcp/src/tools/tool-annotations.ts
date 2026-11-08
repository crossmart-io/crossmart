import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ApiToolSpec } from '@crossmart/core/agent-tools/tools/api-tool.js';

/**
 * The hints an MCP client reads to decide when to confirm a call. A tool that deletes something
 * or overwrites a live value is destructive; one that publishes to a store, sends data to a URL
 * or emails someone is open-world. Read-only tools are neither destructive nor open-world here.
 */
export function toolAnnotations(spec: ApiToolSpec): ToolAnnotations {
  return {
    readOnlyHint: spec.readOnly,
    destructiveHint: !spec.readOnly && (spec.destructive === true || spec.overwrites === true),
    openWorldHint: spec.openWorld ?? false,
  };
}
