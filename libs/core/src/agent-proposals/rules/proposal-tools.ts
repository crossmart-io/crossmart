import { z } from 'zod';
import { type ApiToolSpec, requiresApproval } from '../../agent-tools/tools/api-tool.js';
import { ALL_TOOLS } from '../../agent-tools/tools/index.js';
import { scopePermissions } from '../../agents/permissions/agent-scope-permissions.js';
import type { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import {
  AGENT_PROPOSAL_COPY,
  INPUT_ISSUE_SEPARATOR,
  INPUT_PATH_SEPARATOR,
  INPUT_ROOT_PATH,
} from '../agent-proposals.constants.js';
import { AgentProposalToolError } from '../errors/agent-proposal.errors.js';

/** The write tools of the shared registry whose calls wait for approval, by name. */
const PROPOSABLE_TOOLS = new Map<string, ApiToolSpec>(
  ALL_TOOLS.filter(requiresApproval).map((spec) => [spec.name, spec]),
);

/** A proposable tool by name; a 400 for a read, an exempt tool or an unknown name. */
export function proposableTool(name: string): ApiToolSpec {
  const spec = PROPOSABLE_TOOLS.get(name);
  if (!spec) throw new AgentProposalToolError(AGENT_PROPOSAL_COPY.unknownTool(name));
  return spec;
}

/** A tool's title for people; its name for one no longer offered. */
export function proposalToolTitle(name: string): string {
  return PROPOSABLE_TOOLS.get(name)?.title ?? name;
}

/** The input checked against the tool's strict schema, so nothing it does not take gets in. */
export function parseProposalInput(spec: ApiToolSpec, input: unknown): Record<string, unknown> {
  const parsed = z.object(spec.input).strict().safeParse(input);
  if (parsed.success) return parsed.data;
  const paths = parsed.error.issues.map(
    (issue) => issue.path.join(INPUT_PATH_SEPARATOR) || INPUT_ROOT_PATH,
  );
  const where = [...new Set(paths)].join(INPUT_ISSUE_SEPARATOR);
  throw new AgentProposalToolError(AGENT_PROPOSAL_COPY.invalidInput(where));
}

/** Whether these permissions let someone make the tool's change. */
export function permitsTool(
  spec: ApiToolSpec,
  permissions: ReadonlySet<WorkspacePermission>,
): boolean {
  if (!spec.scope) return false;
  return scopePermissions(spec.scope).some((permission) => permissions.has(permission));
}
