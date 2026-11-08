import { randomUUID } from 'node:crypto';
import { WorkspaceRole } from '@crossmart/database';
import {
  type BuiltInRole,
  builtInPermissions,
} from '../../tenancy/permissions/role-permissions.js';
import type { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import { AgentWorkerConversationNotFoundError } from '../errors/agent-worker.errors.js';
import { AgentWorkerToolKind } from '../enums/agent-worker-tool-kind.enum.js';
import type { ResolvedRole } from '../../tenancy/entities/role-assignment.js';
import { AgentToolName } from '../../agent-tools/agent-tools.constants.js';
import { AgentWorkerToolbox } from './agent-worker-toolbox.js';

function toolbox(role?: BuiltInRole): AgentWorkerToolbox {
  const findRole = (): Promise<ResolvedRole | null> =>
    Promise.resolve(
      role ? { role, customRole: null, permissions: builtInPermissions(role) } : null,
    );
  return new AgentWorkerToolbox({ findRole } as unknown as WorkspaceAccessService);
}

const OWNER = { workspaceId: randomUUID(), userId: randomUUID() };

describe('AgentWorkerToolbox', () => {
  it('offers the MCP tools as model definitions with JSON Schemas', async () => {
    const tools = await toolbox(WorkspaceRole.EDITOR).toolsForMember(OWNER);
    const listing = tools.find((tool) => tool.spec.name === 'update_listing');
    expect(listing?.kind).toBe(AgentWorkerToolKind.Write);
    expect(listing?.definition.inputSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['productId', 'connectionId']),
      additionalProperties: false,
    });
    expect(listing?.definition.inputSchema).not.toHaveProperty('$schema');
  });

  it('rejects input the schema does not allow, such as another workspace', async () => {
    const [tool] = (await toolbox(WorkspaceRole.EDITOR).toolsForMember(OWNER)).filter(
      (candidate) => candidate.spec.name === 'list_products',
    );
    expect(tool?.schema.safeParse({ workspaceId: randomUUID() }).success).toBe(false);
  });

  it('offers a Viewer only reads', async () => {
    const tools = await toolbox(WorkspaceRole.VIEWER).toolsForMember(OWNER);
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.every((tool) => tool.kind === AgentWorkerToolKind.Read)).toBe(true);
  });

  it('asks Crossmart read-only, without escalating or adding webhook endpoints', async () => {
    const names = (await toolbox(WorkspaceRole.OWNER).toolsForMember(OWNER)).map(
      (tool) => tool.spec.name,
    );
    expect(names).toContain(AgentToolName.AskCrossmart);
    expect(names).not.toContain(AgentToolName.EscalateToCrossmartTeam);
    expect(names).not.toContain(AgentToolName.CreateWebhookEndpoint);
  });

  it('answers 404 for someone outside the workspace', async () => {
    await expect(toolbox().toolsForMember(OWNER)).rejects.toBeInstanceOf(
      AgentWorkerConversationNotFoundError,
    );
  });
});
