import { AgentScope } from '@crossmart/core/agents/enums/agent-scope.enum.js';
import {
  accessTokenCredential,
  apiKeyCredential,
} from '@crossmart/core/agent-tools/api/api-credential.js';
import { ALL_TOOLS, ANONYMOUS_TOOLS } from '@crossmart/core/agent-tools/tools/index.js';
import { toolsFor } from './create-mcp-server.js';

const names = (tools: ReturnType<typeof toolsFor>) => tools.map((tool) => tool.name);
const byName = (left: string, right: string): number => left.localeCompare(right);

describe('toolsFor', () => {
  it('offers every tool to an API key', () => {
    expect(toolsFor(apiKeyCredential('cm_key'))).toEqual(ALL_TOOLS);
  });

  it('offers create_account only to a server started without a key', () => {
    expect(toolsFor(undefined)).toEqual([...ALL_TOOLS, ...ANONYMOUS_TOOLS]);
    expect(names(toolsFor(apiKeyCredential('cm_key')))).not.toContain('create_account');
    expect(
      names(toolsFor(accessTokenCredential('a.b.c', 'ws-1', [AgentScope.CatalogWrite]))),
    ).not.toContain('create_account');
  });

  it('offers an agent only the tools its scopes cover', () => {
    const tools = names(toolsFor(accessTokenCredential('a.b.c', 'ws-1', [AgentScope.OrdersRead])));
    expect(tools.toSorted(byName)).toEqual([
      'ask_crossmart',
      'escalate_to_crossmart_team',
      'get_ask_escalation',
      'get_order',
      'get_platform_health',
      'get_proposal',
      'get_started',
      'list_orders',
    ]);
  });

  it('gives every tool a scope but the public ones, checking an own proposal and getting started', () => {
    const unscoped = ALL_TOOLS.filter((tool) => tool.scope === undefined).map((tool) => tool.name);
    expect(unscoped.toSorted(byName)).toEqual([
      'ask_crossmart',
      'escalate_to_crossmart_team',
      'get_ask_escalation',
      'get_platform_health',
      'get_proposal',
      'get_started',
    ]);
  });
});
