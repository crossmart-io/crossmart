import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { AgentWorkerActionRisk } from '../../agent-worker/enums/agent-worker-action-risk.enum.js';
import type { PreviewToolRunner } from '../../agent-worker/previews/preview-reader.js';
import { OutsideAgentChanges } from '../../workspace-settings/enums/outside-agent-changes.enum.js';
import type { WorkspaceSettingsRepository } from '../../workspace-settings/workspace-settings.repository.js';
import { AgentApprovalExemption } from '../enums/agent-approval-exemption.enum.js';
import { AgentProposalOutcome } from '../enums/agent-proposal-outcome.enum.js';
import { AgentProposalStatus } from '../enums/agent-proposal-status.enum.js';
import {
  AgentProposalForbiddenError,
  AgentProposalNotFoundError,
  AgentProposalToolError,
} from '../errors/agent-proposal.errors.js';
import {
  claudeProposer,
  InMemoryAgentProposalRepository,
  PRODUCT_ID,
  VARIANT_ID,
  WORKSPACE_ID,
} from '../testing/agent-proposal.fixtures.js';
import { AgentProposalsService } from './agent-proposals.service.js';

const PRODUCT = {
  title: 'Linen Shirt',
  descriptionHtml: '<p>Soft</p>',
  vendor: null,
  productType: null,
  tags: [],
  status: 'ACTIVE',
  variants: [
    { id: VARIANT_ID, sku: 'LS-M', optionValues: ['M'], price: '24.00', compareAtPrice: null },
  ],
};

/** Answers reads like the API: the product, and the workspace's currency. */
const run: PreviewToolRunner = (spec) => {
  const value = spec.name === 'get_workspace' ? { currency: 'EUR' } : PRODUCT;
  return Promise.resolve({ isError: false, text: JSON.stringify(value), value });
};

function setup(policy = OutsideAgentChanges.RequireApproval) {
  const repository = new InMemoryAgentProposalRepository();
  const settings = {
    outsideAgentChanges: vi.fn(() => Promise.resolve(policy)),
  } as unknown as WorkspaceSettingsRepository;
  const service = new AgentProposalsService(repository.asRepository(), settings);
  return { repository, service };
}

describe('AgentProposalsService', () => {
  it('stores a write as a pending proposal with a preview when approval is required', async () => {
    const { repository, service } = setup();
    const submission = await service.propose(
      claudeProposer(),
      { tool: 'update_product_text', input: { productId: PRODUCT_ID, title: 'Linen Shirt Blue' } },
      run,
    );

    expect(submission.outcome).toBe(AgentProposalOutcome.Proposed);
    expect(submission.message).toContain("waiting for the seller's approval");
    expect(submission.proposal).toMatchObject({
      status: AgentProposalStatus.Pending,
      agentName: 'Claude',
      onBehalfOfName: 'Dana',
      targets: { productIds: [PRODUCT_ID], connectionIds: [] },
    });
    expect(submission.proposal?.preview?.changes).toContainEqual({
      label: 'Title',
      before: 'Linen Shirt',
      after: 'Linen Shirt Blue',
    });
    expect(repository.records).toHaveLength(1);
  });

  it('tags a real price change as a risk', async () => {
    const { service } = setup();
    const input = { productId: PRODUCT_ID, variantId: VARIANT_ID, price: '19.00' };
    const submission = await service.propose(
      claudeProposer(),
      { tool: 'update_variant_price', input },
      run,
    );

    expect(submission.proposal?.risks).toEqual([AgentWorkerActionRisk.PriceChange]);
  });

  it('stores nothing and says so when agents may apply directly', async () => {
    const { repository, service } = setup(OutsideAgentChanges.ApplyDirectly);
    const submission = await service.propose(
      claudeProposer(),
      { tool: 'update_product_text', input: { productId: PRODUCT_ID, title: 'New' } },
      run,
    );

    expect(submission).toMatchObject({
      outcome: AgentProposalOutcome.ApplyDirectly,
      proposal: null,
    });
    expect(repository.records).toHaveLength(0);
  });

  describe('create_product while approval is required', () => {
    const draft = { title: 'Levi 501', variants: [{ price: '40.00' }] };

    it('stores nothing for a new draft and says it needs no approval', async () => {
      const { repository, service } = setup();
      for (const input of [draft, { ...draft, status: 'DRAFT' }]) {
        const submission = await service.propose(
          claudeProposer(),
          { tool: 'create_product', input },
          run,
        );
        expect(submission).toMatchObject({
          outcome: AgentProposalOutcome.ApplyDirectly,
          proposal: null,
          exemption: AgentApprovalExemption.NewDraft,
        });
        expect(submission.message).toContain('New drafts need no approval');
      }
      expect(repository.records).toHaveLength(0);
    });

    it('proposes an active product, saying how a draft would apply at once', async () => {
      const { repository, service } = setup();
      const input = { ...draft, status: 'ACTIVE' };
      const submission = await service.propose(
        claudeProposer(),
        { tool: 'create_product', input },
        run,
      );

      expect(submission).toMatchObject({ outcome: AgentProposalOutcome.Proposed, exemption: null });
      expect(submission.message).toContain('Only new drafts are created without approval');
      expect(repository.records).toHaveLength(1);
    });

    it('still refuses a draft from a connection that may not edit the catalog', async () => {
      const { service } = setup();
      const readOnly = claudeProposer({ permissions: new Set([WorkspacePermission.ViewProducts]) });
      await expect(
        service.propose(readOnly, { tool: 'create_product', input: draft }, run),
      ).rejects.toThrow(AgentProposalForbiddenError);
    });
  });

  it('marks no exemption when agents may apply everything directly', async () => {
    const { service } = setup(OutsideAgentChanges.ApplyDirectly);
    const input = { title: 'Levi 501', variants: [{ price: '40.00' }] };
    const submission = await service.propose(
      claudeProposer(),
      { tool: 'create_product', input },
      run,
    );
    expect(submission).toMatchObject({
      outcome: AgentProposalOutcome.ApplyDirectly,
      exemption: null,
    });
  });

  it('refuses reads, exempt tools and unknown ones', async () => {
    const { service } = setup();
    for (const tool of ['list_products', 'generate_content', 'drop_tables']) {
      await expect(service.propose(claudeProposer(), { tool, input: {} }, run)).rejects.toThrow(
        AgentProposalToolError,
      );
    }
  });

  it('refuses input the tool does not take, naming where', async () => {
    const { service } = setup();
    const input = { productId: PRODUCT_ID, title: 'New', workspaceId: WORKSPACE_ID };
    await expect(
      service.propose(claudeProposer(), { tool: 'update_product_text', input }, run),
    ).rejects.toThrow(/schema/);
  });

  it('refuses a change the caller could not make itself', async () => {
    const { service } = setup();
    const readOnly = claudeProposer({ permissions: new Set([WorkspacePermission.ViewProducts]) });
    const input = { productId: PRODUCT_ID, title: 'New' };
    await expect(
      service.propose(readOnly, { tool: 'update_product_text', input }, run),
    ).rejects.toThrow(AgentProposalForbiddenError);
  });

  it('lets an agent read only the proposals it made', async () => {
    const { service } = setup();
    const submission = await service.propose(
      claudeProposer(),
      { tool: 'update_product_text', input: { productId: PRODUCT_ID, title: 'New' } },
      run,
    );
    const id = submission.proposal?.id ?? '';
    const other = claudeProposer({ oauthClientId: 'https://chatgpt.com/client' });

    await expect(service.getForProposer(claudeProposer(), id)).resolves.toMatchObject({ id });
    await expect(service.getForProposer(other, id)).rejects.toThrow(AgentProposalNotFoundError);
    expect(await service.countPending(WORKSPACE_ID)).toBe(1);
  });
});
