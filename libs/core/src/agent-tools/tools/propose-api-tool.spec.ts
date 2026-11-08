import { apiKeyCredential } from '../api/api-credential.js';
import { CrossmartApiClient } from '../api/crossmart-api-client.js';
import { CrossmartApiError } from '../api/crossmart-api.error.js';
import { AgentToolName } from '../agent-tools.constants.js';
import { AgentProposalOutcome } from '../../agent-proposals/enums/agent-proposal-outcome.enum.js';
import { requiresApproval } from './api-tool.js';
import { ALL_TOOLS, ANONYMOUS_TOOLS } from './index.js';
import { proposeApiTool } from './propose-api-tool.js';

const tool = (name: string) => {
  const spec = [...ALL_TOOLS, ...ANONYMOUS_TOOLS].find((candidate) => candidate.name === name);
  if (!spec) throw new Error(name);
  return spec;
};

describe('requiresApproval', () => {
  it('holds for workspace writes, not reads, exempt tools or tools outside a workspace', () => {
    expect(requiresApproval(tool(AgentToolName.UpdateVariantPrice))).toBe(true);
    expect(requiresApproval(tool(AgentToolName.ApproveSuggestion))).toBe(true);
    expect(requiresApproval(tool(AgentToolName.CreateWebhookEndpoint))).toBe(true);
    expect(requiresApproval(tool(AgentToolName.GetProduct))).toBe(false);
    expect(requiresApproval(tool(AgentToolName.GetProposal))).toBe(false);
    expect(requiresApproval(tool(AgentToolName.GenerateContent))).toBe(false);
    expect(requiresApproval(tool(AgentToolName.EscalateToCrossmartTeam))).toBe(false);
    expect(requiresApproval(tool('create_account'))).toBe(false);
  });
});

describe('proposeApiTool', () => {
  const spec = tool(AgentToolName.UpdateProductText);
  const input = { productId: 'p-1', title: 'New' };

  function client(): CrossmartApiClient {
    return new CrossmartApiClient('https://api.example.com', apiKeyCredential('cm_key'));
  }

  it('answers a stored proposal with its id, not as an error', async () => {
    const api = client();
    const proposal = { id: 'pr-1', status: 'pending', summary: 'Title', expiresAt: 'x' };
    vi.spyOn(api, 'call').mockResolvedValue({
      outcome: AgentProposalOutcome.Proposed,
      message: 'Waiting',
      proposal,
    });
    const result = await proposeApiTool(spec, api, input);
    expect(result.isError).toBe(false);
    expect(result.value).toMatchObject({ status: 'proposed', proposalId: 'pr-1' });
  });

  it('passes a refusal of the proposal on, like any refusal', async () => {
    const api = client();
    vi.spyOn(api, 'call').mockRejectedValue(new CrossmartApiError(403, 'Not allowed'));
    const result = await proposeApiTool(spec, api, input);
    expect(result).toMatchObject({ isError: true, status: 403 });
    expect(result.text).toBe('Crossmart refused (403): Not allowed');
  });
});
