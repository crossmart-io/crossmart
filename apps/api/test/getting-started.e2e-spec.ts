import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  GettingStartedStep,
  GettingStartedStepOwner,
  GettingStartedStepState,
} from '@crossmart/core';
import { ChannelType } from '@crossmart/connectors';
import { connectAgent, registerAgent } from './support/agent-oauth.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

interface StepBody {
  step: GettingStartedStep;
  state: GettingStartedStepState;
  owner: GettingStartedStepOwner;
  url: string | null;
  tools: string[];
}

describe('Getting started (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  function read(workspaceId: string, auth: Record<string, string>) {
    return request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/getting-started`)
      .set(auth);
  }

  async function createProduct({ cookie, workspaceId }: SignedUpUser): Promise<void> {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/products`)
      .set('Cookie', cookie)
      .send({ title: 'Vintage Levi 501', variants: [{ price: '45', quantity: 1 }] });
    expect(response.status).toBe(HttpStatus.CREATED);
  }

  it('shows a new account empty, with adding products as the first step', async () => {
    const user = await signUp(app, 'New Seller');

    const response = await read(user.workspaceId, { Cookie: user.cookie });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      emailVerified: false,
      unclaimedSandbox: false,
      products: 0,
      connectedStores: 0,
      liveListings: 0,
      pendingProposals: 0,
      agentChangesNeedApproval: true,
      nextStep: GettingStartedStep.AddProducts,
    });
    const steps = response.body.steps as StepBody[];
    expect(steps.find((step) => step.step === GettingStartedStep.Publish)?.state).toBe(
      GettingStartedStepState.Blocked,
    );
    expect(response.body.connectStoreLinks).toContainEqual({
      channel: ChannelType.Shopify,
      url: expect.stringMatching(/\/stores\?connect=shopify$/),
    });
  });

  it('moves on to connecting a store once there is a product', async () => {
    const user = await signUp(app, 'Seller With Stock');
    await createProduct(user);

    const response = await read(user.workspaceId, { Cookie: user.cookie });

    expect(response.body.products).toBe(1);
    expect(response.body.nextStep).toBe(GettingStartedStep.ConnectStore);
    const connect = (response.body.steps as StepBody[]).find(
      (step) => step.step === GettingStartedStep.ConnectStore,
    );
    expect(connect).toMatchObject({
      owner: GettingStartedStepOwner.Merchant,
      url: expect.stringMatching(/\/stores$/),
    });
  });

  it('answers an agent with the narrowest scope, for the user it acts for', async () => {
    const user = await signUp(app, 'Agent User');
    const clientId = await registerAgent(app, 'First-run agent');
    const tokens = await connectAgent(app, user, { clientId, scope: 'orders:read' });

    const response = await read(user.workspaceId, {
      Authorization: `Bearer ${tokens.accessToken}`,
    });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.emailVerified).toBe(false);
    expect(response.body.nextStep).toBe(GettingStartedStep.AddProducts);
  });

  it('is closed to people outside the workspace', async () => {
    const owner = await signUp(app, 'Owner');
    const stranger = await signUp(app, 'Stranger');

    const response = await read(owner.workspaceId, { Cookie: stranger.cookie });

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
