import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  ActivityAction,
  AgentApprovalExemption,
  AgentProposalExpiryService,
  AgentProposalOutcome,
  AgentProposalStatus,
  OutsideAgentChanges,
  WORKSPACE_EVENT_SETTLE_MS,
} from '@crossmart/core';
import { PrismaService, ProductStatus, WorkspaceRole } from '@crossmart/database';
import { type AgentTokens, connectAgent, registerAgent } from './support/agent-oauth.js';
import { createTestApp, type SignedUpUser, signUp } from './support/test-app.js';

/** Past the event stream's settle time, so what was just written is readable. */
const SETTLED_DELAY_MS = WORKSPACE_EVENT_SETTLE_MS + 300;

interface Product {
  id: string;
  title: string;
  variants: { id: string; price: string }[];
}

describe("Outside agents' changes wait for approval (ADR 0028)", () => {
  let app: INestApplication<App>;
  let owner: SignedUpUser;
  let tokens: AgentTokens;
  let product: Product;
  const server = () => request(app.getHttpServer());
  const base = () => `/api/v1/workspaces/${owner.workspaceId}`;
  const asAgent = (agent: AgentTokens = tokens) => ({
    Authorization: `Bearer ${agent.accessToken}`,
  });

  function propose(tool: string, input: Record<string, unknown>, agent = tokens) {
    return server().post(`${base()}/agent-proposals`).set(asAgent(agent)).send({ tool, input });
  }

  function decide(proposalId: string, decision: 'approve' | 'reject', body = {}) {
    return server()
      .post(`${base()}/agent-proposals/${proposalId}/${decision}`)
      .set('Cookie', owner.cookie)
      .send(body);
  }

  async function currentProduct(): Promise<Product> {
    const response = await server()
      .get(`${base()}/products/${product.id}`)
      .set('Cookie', owner.cookie);
    return response.body as Product;
  }

  function setPolicy(outsideAgentChanges: OutsideAgentChanges) {
    return server().patch(base()).set('Cookie', owner.cookie).send({ outsideAgentChanges });
  }

  beforeAll(async () => {
    app = await createTestApp();
    // Approved proposals and previews call the API over loopback, so the test server listens.
    await app.listen(0);
    owner = await signUp(app, 'Dana');
    tokens = await connectAgent(app, owner, { clientId: await registerAgent(app, 'Claude') });
    const created = await server()
      .post(`${base()}/products`)
      .set('Cookie', owner.cookie)
      .send({ title: 'Linen Shirt', variants: [{ price: '24.00' }] });
    product = created.body as Product;
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires approval by default, for every workspace', async () => {
    const workspace = await server().get(base()).set('Cookie', owner.cookie);
    expect(workspace.body.outsideAgentChanges).toBe(OutsideAgentChanges.RequireApproval);
  });

  it('turns a connected agent’s direct REST write away, pointing to proposals', async () => {
    const response = await server()
      .patch(`${base()}/products/${product.id}`)
      .set(asAgent())
      .send({ title: 'Changed directly' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    expect(response.body.code).toBe('agent_approval_required');
    expect((await currentProduct()).title).toBe('Linen Shirt');
  });

  it('still lets the agent read', async () => {
    const response = await server().get(`${base()}/products`).set(asAgent());
    expect(response.status).toBe(HttpStatus.OK);
  });

  it('stores a proposal with a before-and-after preview, and changes nothing', async () => {
    const response = await propose('update_product_text', {
      productId: product.id,
      title: 'Linen Shirt Blue',
    });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.outcome).toBe(AgentProposalOutcome.Proposed);
    expect(response.body.message).toContain("waiting for the seller's approval");
    expect(response.body.proposal).toMatchObject({
      status: AgentProposalStatus.Pending,
      agentName: 'Claude',
      onBehalfOfName: 'Dana',
      targets: { productIds: [product.id] },
    });
    expect(response.body.proposal.preview.changes).toContainEqual({
      label: 'Title',
      before: 'Linen Shirt',
      after: 'Linen Shirt Blue',
    });
    expect((await currentProduct()).title).toBe('Linen Shirt');
  });

  it('refuses reads, unknown tools and input the tool does not take', async () => {
    const read = await propose('list_products', {});
    const extra = await propose('update_product_text', {
      productId: product.id,
      title: 'X',
      workspaceId: owner.workspaceId,
    });
    expect(read.status).toBe(HttpStatus.BAD_REQUEST);
    expect(extra.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('applies an approved proposal as the agent, approved by the person', async () => {
    const proposed = await propose('update_product_text', {
      productId: product.id,
      title: 'Approved Title',
    });
    const id = proposed.body.proposal.id as string;

    const pending = await server().get(`${base()}/agent-proposals`).set('Cookie', owner.cookie);
    expect(pending.body.items.map((item: { id: string }) => item.id)).toContain(id);
    const summary = await server()
      .get(`${base()}/agent-proposals/summary`)
      .set('Cookie', owner.cookie);
    expect(summary.body.pendingCount).toBeGreaterThan(0);

    const approved = await decide(id, 'approve');
    expect(approved.status).toBe(HttpStatus.OK);
    expect(approved.body).toMatchObject({
      status: AgentProposalStatus.Applied,
      decidedByName: 'Dana',
    });
    expect((await currentProduct()).title).toBe('Approved Title');

    const asSeenByAgent = await server().get(`${base()}/agent-proposals/${id}`).set(asAgent());
    expect(asSeenByAgent.body.status).toBe(AgentProposalStatus.Applied);

    const activity = await server().get(`${base()}/activity`).set('Cookie', owner.cookie);
    expect(activity.body.items[0].actor).toMatchObject({
      type: 'AGENT',
      agentName: 'Claude',
      name: 'Dana',
      approvedByName: 'Dana',
    });
    expect((await decide(id, 'approve')).status).toBe(HttpStatus.CONFLICT);
  });

  it('needs an explicit confirmation to approve a price change', async () => {
    const proposed = await propose('update_variant_price', {
      productId: product.id,
      variantId: product.variants[0]?.id,
      price: '19.00',
    });
    const id = proposed.body.proposal.id as string;
    expect(proposed.body.proposal.risks).toEqual(['price_change']);

    expect((await decide(id, 'approve')).status).toBe(HttpStatus.BAD_REQUEST);
    const confirmed = await decide(id, 'approve', { confirmHighRisk: true });
    expect(confirmed.body.status).toBe(AgentProposalStatus.Applied);
    expect((await currentProduct()).variants[0]?.price).toBe('19.00');
  });

  it('records a rejection, and the agent reads it', async () => {
    const proposed = await propose('update_product_text', { productId: product.id, title: 'No' });
    const id = proposed.body.proposal.id as string;

    const rejected = await decide(id, 'reject');
    expect(rejected.body.status).toBe(AgentProposalStatus.Rejected);
    const seen = await server().get(`${base()}/agent-proposals/${id}`).set(asAgent());
    expect(seen.body.status).toBe(AgentProposalStatus.Rejected);
    const activity = await server().get(`${base()}/activity`).set('Cookie', owner.cookie);
    expect(activity.body.items[0].action).toBe(ActivityAction.AgentProposalRejected);
  });

  it('expires proposals nobody decided, and the agent reads that', async () => {
    const proposed = await propose('update_product_text', { productId: product.id, title: 'Late' });
    const id = proposed.body.proposal.id as string;
    const prisma = app.get(PrismaService);
    await prisma.agentProposal.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() - 1) },
    });

    const seen = await server().get(`${base()}/agent-proposals/${id}`).set(asAgent());
    expect(seen.body.status).toBe(AgentProposalStatus.Expired);
    expect((await decide(id, 'approve')).status).toBe(HttpStatus.CONFLICT);
    expect(await app.get(AgentProposalExpiryService).expire()).toBeGreaterThanOrEqual(1);
    const stored = await prisma.agentProposal.findUniqueOrThrow({ where: { id } });
    expect(stored.status).toBe(AgentProposalStatus.Expired);
  });

  it('shows proposals in the workspace event stream', async () => {
    await new Promise((resolve) => setTimeout(resolve, SETTLED_DELAY_MS));
    const events = await server().get(`${base()}/events`).set('Cookie', owner.cookie);
    const types = (events.body.items as { type: string }[]).map((event) => event.type);
    expect(types).toEqual(
      expect.arrayContaining(['agent.proposal_received', 'agent.proposal_rejected']),
    );
  });

  it('lets an agent read only its own proposals', async () => {
    const proposed = await propose('update_product_text', { productId: product.id, title: 'Mine' });
    const other = await connectAgent(app, owner, { clientId: await registerAgent(app, 'Other') });

    const peek = await server()
      .get(`${base()}/agent-proposals/${proposed.body.proposal.id}`)
      .set(asAgent(other));
    const list = await server().get(`${base()}/agent-proposals`).set(asAgent(other));
    expect(peek.status).toBe(HttpStatus.NOT_FOUND);
    expect(list.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('fails an approved proposal whose agent was disconnected since', async () => {
    const agent = await connectAgent(app, owner, { clientId: await registerAgent(app, 'Gone') });
    const proposed = await propose(
      'update_product_text',
      { productId: product.id, title: 'Gone' },
      agent,
    );
    const connections = await server()
      .get(`${base()}/agent-connections`)
      .set('Cookie', owner.cookie);
    const gone = (connections.body as { id: string; clientName: string }[]).find(
      (connection) => connection.clientName === 'Gone',
    );
    await server().delete(`${base()}/agent-connections/${gone?.id}`).set('Cookie', owner.cookie);

    const approved = await decide(proposed.body.proposal.id as string, 'approve');
    expect(approved.body).toMatchObject({ status: AgentProposalStatus.Failed, isError: true });
    expect(approved.body.result).toContain('no longer connected');
  });

  describe('new drafts need no approval', () => {
    const draft = { title: 'Vintage Levi 501', variants: [{ price: '40.00', quantity: 1 }] };

    async function pendingCount(): Promise<number> {
      const summary = await server()
        .get(`${base()}/agent-proposals/summary`)
        .set('Cookie', owner.cookie);
      return summary.body.pendingCount as number;
    }

    it('creates a draft over REST at once, credited to the agent, with nothing to review', async () => {
      const pendingBefore = await pendingCount();
      const created = await server().post(`${base()}/products`).set(asAgent()).send(draft);

      expect(created.status).toBe(HttpStatus.CREATED);
      expect(created.body.status).toBe(ProductStatus.DRAFT);
      expect(await pendingCount()).toBe(pendingBefore);
      const activity = await server().get(`${base()}/activity`).set('Cookie', owner.cookie);
      expect(activity.body.items[0]).toMatchObject({
        action: ActivityAction.ProductCreated,
        actor: { type: 'AGENT', agentName: 'Claude', name: 'Dana', approvedByName: null },
      });
    });

    it('answers a proposed draft with apply_directly and the exemption, storing nothing', async () => {
      const pendingBefore = await pendingCount();
      const response = await propose('create_product', { ...draft, status: ProductStatus.DRAFT });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        outcome: AgentProposalOutcome.ApplyDirectly,
        exemption: AgentApprovalExemption.NewDraft,
        proposal: null,
      });
      expect(await pendingCount()).toBe(pendingBefore);
    });

    it('turns a direct ACTIVE create away, and proposes it for the seller', async () => {
      const active = { ...draft, title: 'Active jeans', status: ProductStatus.ACTIVE };
      const direct = await server().post(`${base()}/products`).set(asAgent()).send(active);
      expect(direct.status).toBe(HttpStatus.FORBIDDEN);
      expect(direct.body.code).toBe('agent_approval_required');

      const proposed = await propose('create_product', active);
      expect(proposed.body).toMatchObject({
        outcome: AgentProposalOutcome.Proposed,
        exemption: null,
      });
      expect(proposed.body.message).toContain('Only new drafts are created without approval');

      const approved = await decide(proposed.body.proposal.id as string, 'approve');
      expect(approved.body.status).toBe(AgentProposalStatus.Applied);
      const list = await server()
        .get(`${base()}/products`)
        .query({ search: 'Active jeans' })
        .set('Cookie', owner.cookie);
      expect(list.body.items[0]?.status).toBe(ProductStatus.ACTIVE);
    });

    it('still proposes changes to the draft once it exists', async () => {
      const later = { ...draft, title: 'Corduroy jacket' };
      const created = await server().post(`${base()}/products`).set(asAgent()).send(later);
      expect(created.status).toBe(HttpStatus.CREATED);
      const productId = created.body.id as string;

      const direct = await server()
        .put(`${base()}/products/${productId}`)
        .set(asAgent())
        .send({ ...later, handle: created.body.handle, status: ProductStatus.ACTIVE });
      expect(direct.status).toBe(HttpStatus.FORBIDDEN);
      const proposed = await propose('update_product_text', { productId, title: 'Renamed' });
      expect(proposed.body.outcome).toBe(AgentProposalOutcome.Proposed);
    });
  });

  describe('API keys', () => {
    let secret: string;

    beforeAll(async () => {
      const key = await server()
        .post(`${base()}/api-keys`)
        .set('Cookie', owner.cookie)
        .send({ name: 'n8n', role: WorkspaceRole.EDITOR });
      secret = key.body.secret as string;
    });

    it('keep writing directly over REST, as integrations do', async () => {
      const response = await server()
        .patch(`${base()}/products/${product.id}`)
        .set(API_KEY_HEADER, secret)
        .send({ title: 'From n8n' });
      expect(response.status).toBe(HttpStatus.OK);
    });

    it('propose when an MCP session uses them, named after the key', async () => {
      const response = await server()
        .post(`${base()}/agent-proposals`)
        .set(API_KEY_HEADER, secret)
        .send({ tool: 'update_product_text', input: { productId: product.id, title: 'Via MCP' } });
      expect(response.body.proposal).toMatchObject({ proposerKind: 'api_key', agentName: 'n8n' });

      const approved = await decide(response.body.proposal.id as string, 'approve');
      expect(approved.body.status).toBe(AgentProposalStatus.Applied);
    });

    it('cannot change whether agents need approval; people only', async () => {
      const response = await server()
        .patch(base())
        .set(API_KEY_HEADER, secret)
        .send({ outsideAgentChanges: OutsideAgentChanges.ApplyDirectly });
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('when the owner lets agents apply directly', () => {
    afterAll(async () => {
      await setPolicy(OutsideAgentChanges.RequireApproval);
    });

    it('is a choice the owner makes, recorded in the activity log', async () => {
      const response = await setPolicy(OutsideAgentChanges.ApplyDirectly);
      expect(response.body.outsideAgentChanges).toBe(OutsideAgentChanges.ApplyDirectly);
      const activity = await server().get(`${base()}/activity`).set('Cookie', owner.cookie);
      expect(activity.body.items[0]).toMatchObject({
        action: ActivityAction.OutsideAgentChangesChanged,
      });
    });

    it('stores nothing and lets the agent write itself', async () => {
      const proposal = await propose('update_product_text', { productId: product.id, title: 'D' });
      expect(proposal.body).toMatchObject({
        outcome: AgentProposalOutcome.ApplyDirectly,
        proposal: null,
      });
      const direct = await server()
        .patch(`${base()}/products/${product.id}`)
        .set(asAgent())
        .send({ title: 'Direct' });
      expect(direct.status).toBe(HttpStatus.OK);
    });
  });
});
