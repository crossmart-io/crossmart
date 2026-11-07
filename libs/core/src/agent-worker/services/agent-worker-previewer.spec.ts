import { randomUUID } from 'node:crypto';
import { AgentToolName } from '../../agent-tools/agent-tools.constants.js';
import type { ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import { ALL_TOOLS } from '../../agent-tools/tools/index.js';
import { AgentWorkerToolKind } from '../enums/agent-worker-tool-kind.enum.js';
import { RecordingToolExecutor } from '../testing/recording-tool.executor.js';
import { AgentWorkerToolbox } from '../tools/agent-worker-toolbox.js';
import type { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import { builtInPermissions } from '../../tenancy/permissions/role-permissions.js';
import { WorkspaceRole } from '@crossmart/database';
import { AgentWorkerPreviewer } from './agent-worker-previewer.js';

const SCOPE = { workspaceId: randomUUID(), userId: randomUUID(), conversationId: randomUUID() };

function spec(name: string): ApiToolSpec {
  const found = ALL_TOOLS.find((tool) => tool.name === name);
  if (!found) throw new Error(name);
  return found;
}

describe('AgentWorkerPreviewer', () => {
  it('falls back to the values set, with readable labels, when the API cannot be read', async () => {
    const executor = new RecordingToolExecutor().refuse(
      AgentToolName.GetInventoryItem,
      'Not found',
      404,
    );
    const preview = await new AgentWorkerPreviewer(executor).preview(
      SCOPE,
      spec(AgentToolName.AdjustStock),
      {
        inventoryItemId: randomUUID(),
        mode: 'delta',
        quantity: 2,
        reason: 'RECEIVED',
      },
    );
    expect(preview.headline).toBe('Adjust stock');
    expect(preview.changes).toContainEqual({ label: 'Quantity', before: null, after: '2' });
  });

  it('uses the generic view for a tool without a formatter', async () => {
    const custom = {
      ...spec(AgentToolName.AdjustStock),
      name: 'some_new_tool',
      title: 'Do a thing',
    };
    const preview = await new AgentWorkerPreviewer(new RecordingToolExecutor()).preview(
      SCOPE,
      custom,
      {
        maxQuantity: 3,
      },
    );
    expect(preview).toEqual({
      target: null,
      headline: 'Do a thing',
      details: [],
      changes: [{ label: 'Max quantity', before: null, after: '3' }],
    });
  });

  it('has a formatter for every write tool it offers', () => {
    const findRole = () =>
      Promise.resolve({
        role: WorkspaceRole.OWNER,
        customRole: null,
        permissions: builtInPermissions(WorkspaceRole.OWNER),
      });
    const toolbox = new AgentWorkerToolbox({ findRole } as unknown as WorkspaceAccessService);
    const writes = toolbox
      .toolsFor(builtInPermissions(WorkspaceRole.OWNER))
      .filter((tool) => tool.kind === AgentWorkerToolKind.Write)
      .map((tool) => tool.spec.name);
    const previewer = new AgentWorkerPreviewer(new RecordingToolExecutor());
    expect(writes.filter((name) => !previewer.hasFormatter(name))).toEqual([]);
  });
});
