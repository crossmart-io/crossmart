import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import { askCrossmartTool } from '../../agent-tools/tools/ask.tools.js';
import { ALL_TOOLS } from '../../agent-tools/tools/index.js';
import { AskChannel } from '../../ask/enums/ask-channel.enum.js';
import { scopePermissions } from '../../agents/permissions/agent-scope-permissions.js';
import type { AiToolDefinition } from '../../ai/entities/ai-conversation.js';
import type { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import type { AgentWorkerOwner } from '../entities/agent-worker-owner.js';
import { AgentWorkerConversationNotFoundError } from '../errors/agent-worker.errors.js';
import { AGENT_WORKER_SCOPES } from '../agent-worker.constants.js';
import { AgentWorkerToolKind } from '../enums/agent-worker-tool-kind.enum.js';

/** A tool as Agent Worker offers it: the shared spec, how it runs, and its model definition. */
export interface AgentWorkerTool {
  spec: ApiToolSpec;
  kind: AgentWorkerToolKind;
  schema: z.ZodObject;
  definition: AiToolDefinition;
}

const JSON_SCHEMA_KEY = '$schema';

function toTool(spec: ApiToolSpec): AgentWorkerTool {
  const schema = z.object(spec.input).strict();
  const { [JSON_SCHEMA_KEY]: _dialect, ...inputSchema } = z.toJSONSchema(schema);
  return {
    spec,
    kind: spec.readOnly ? AgentWorkerToolKind.Read : AgentWorkerToolKind.Write,
    schema,
    definition: { name: spec.name, description: spec.description, inputSchema },
  };
}

/**
 * The tools Agent Worker offers: the MCP server's own (`libs/core/src/agent-tools`), limited to
 * Agent Worker's scopes (no webhooks or account tools) and to what the person's role allows, so
 * the model is never offered a tool the person could not use, plus `ask_crossmart` for questions
 * about Crossmart itself, read-only (it cannot escalate). The API still checks every call.
 */
@Injectable()
export class AgentWorkerToolbox {
  private readonly tools: readonly AgentWorkerTool[] = [
    ...ALL_TOOLS.filter(
      (spec) => spec.scope !== undefined && AGENT_WORKER_SCOPES.includes(spec.scope),
    ),
    askCrossmartTool(AskChannel.AgentWorker, false),
  ].map(toTool);

  constructor(private readonly workspaceAccess: WorkspaceAccessService) {}

  /** The tools the person's current role allows; 404 once they left the workspace. */
  async toolsForMember(owner: AgentWorkerOwner): Promise<AgentWorkerTool[]> {
    const role = await this.workspaceAccess.findRole(owner.workspaceId, owner.userId);
    if (!role) throw new AgentWorkerConversationNotFoundError();
    return this.toolsFor(role.permissions);
  }

  toolsFor(permissions: ReadonlySet<WorkspacePermission>): AgentWorkerTool[] {
    return this.tools.filter(
      ({ spec }) =>
        spec.scope === undefined ||
        scopePermissions(spec.scope).some((permission) => permissions.has(permission)),
    );
  }

  /** Any of Agent Worker's tools by name, whatever the role, for showing past calls. */
  find(name: string): AgentWorkerTool | undefined {
    return this.tools.find((tool) => tool.spec.name === name);
  }

  /** A tool's title by name, for the chat; the name itself for a tool no longer offered. */
  titleOf(toolName: string): string {
    return this.find(toolName)?.spec.title ?? toolName;
  }
}
