import { apiKeyCredential } from '../api/api-credential.js';
import { CrossmartApiClient } from '../api/crossmart-api-client.js';
import { CrossmartApiError } from '../api/crossmart-api.error.js';
import { AgentToolName } from '../agent-tools.constants.js';
import { AgentApprovalExemption } from '../../agent-proposals/enums/agent-approval-exemption.enum.js';
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

  describe('a new draft, while the workspace approves agents’ changes', () => {
    const create = tool(AgentToolName.CreateProduct);
    const draft = { title: 'Levi 501', variants: [{ price: '40.00' }] };
    const product = { id: 'p-9', title: 'Levi 501', status: 'DRAFT' };

    function answering(...answers: unknown[]): CrossmartApiClient {
      const api = client();
      const call = vi.spyOn(api, 'call');
      for (const answer of answers) {
        if (answer instanceof Error) call.mockRejectedValueOnce(answer);
        else call.mockResolvedValueOnce(answer);
      }
      return api;
    }

    const exempt = {
      outcome: AgentProposalOutcome.ApplyDirectly,
      message: 'Make the call itself',
      proposal: null,
      exemption: AgentApprovalExemption.NewDraft,
    };

    it('creates it at once and tells the agent it is a draft that applied', async () => {
      const result = await proposeApiTool(create, answering(exempt, product), draft);

      expect(result.value).toEqual(product);
      expect(result.proposed).toBeUndefined();
      expect(result.applied).toMatchObject({
        status: 'applied',
        exemption: AgentApprovalExemption.NewDraft,
      });
      expect(result.applied?.message).toContain('draft');
    });

    it('passes a refusal of the create on, such as a full sandbox, without the note', async () => {
      const full = new CrossmartApiError(403, 'Claim the account', 'sandbox_claim_required');
      const result = await proposeApiTool(create, answering(exempt, full), draft);

      expect(result).toMatchObject({ isError: true, code: 'sandbox_claim_required' });
      expect(result.applied).toBeUndefined();
    });

    it('adds no note when the workspace applies every change directly', async () => {
      const direct = { ...exempt, exemption: null };
      const result = await proposeApiTool(create, answering(direct, product), draft);
      expect(result.applied).toBeUndefined();
    });
  });
});
