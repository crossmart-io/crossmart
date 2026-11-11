import { ChannelType } from '@crossmart/connectors';
import type { AccountProgress } from '../entities/getting-started.js';
import { GettingStartedStepOwner } from '../enums/getting-started-step-owner.enum.js';
import { GettingStartedStepState } from '../enums/getting-started-step-state.enum.js';
import { GettingStartedStep } from '../enums/getting-started-step.enum.js';
import { gettingStarted } from './getting-started-steps.js';

const WEB = 'https://app.example';

const FRESH: AccountProgress = {
  emailVerified: false,
  unclaimedSandbox: false,
  products: 0,
  connectedStores: 0,
  liveListings: 0,
  pendingProposals: 0,
  agentChangesNeedApproval: true,
};

function states(progress: AccountProgress): Record<string, GettingStartedStepState> {
  return Object.fromEntries(
    gettingStarted(progress, WEB).steps.map((step) => [step.step, step.state]),
  );
}

describe('gettingStarted', () => {
  it('starts a fresh account on adding products, which an agent can do before any store', () => {
    const view = gettingStarted(FRESH, WEB);

    expect(view.nextStep).toBe(GettingStartedStep.AddProducts);
    const addProducts = view.steps.find((step) => step.step === GettingStartedStep.AddProducts);
    expect(addProducts).toMatchObject({
      owner: GettingStartedStepOwner.Agent,
      tools: ['create_product'],
      url: `${WEB}/products`,
    });
    expect(states(FRESH)).toEqual({
      [GettingStartedStep.ReviewProposals]: GettingStartedStepState.Done,
      [GettingStartedStep.AddProducts]: GettingStartedStepState.Todo,
      [GettingStartedStep.ConnectStore]: GettingStartedStepState.Todo,
      [GettingStartedStep.Publish]: GettingStartedStepState.Blocked,
      [GettingStartedStep.VerifyEmail]: GettingStartedStepState.Todo,
    });
  });

  it('links the seller to each channel’s connect dialog', () => {
    expect(gettingStarted(FRESH, WEB).connectStoreLinks).toEqual([
      { channel: ChannelType.Shopify, url: `${WEB}/stores?connect=shopify` },
      { channel: ChannelType.Ebay, url: `${WEB}/stores?connect=ebay` },
    ]);
  });

  it('asks the seller to connect a store once products wait, with a link to Stores', () => {
    const view = gettingStarted({ ...FRESH, products: 3, agentChangesNeedApproval: false }, WEB);

    expect(view.nextStep).toBe(GettingStartedStep.ConnectStore);
    const connect = view.steps.find((step) => step.step === GettingStartedStep.ConnectStore);
    expect(connect).toMatchObject({
      owner: GettingStartedStepOwner.Merchant,
      url: `${WEB}/stores`,
    });
    expect(view.steps.map((step) => step.step)).not.toContain(GettingStartedStep.ReviewProposals);
  });

  it('asks the seller to approve the agent’s first products before adding more', () => {
    const view = gettingStarted({ ...FRESH, pendingProposals: 2 }, WEB);

    expect(view.nextStep).toBe(GettingStartedStep.ReviewProposals);
    const review = view.steps.find((step) => step.step === GettingStartedStep.ReviewProposals);
    expect(review?.url).toBe(`${WEB}/agent/review`);
  });

  it('opens publishing once there are products and a store, and ends with the email', () => {
    const ready = { ...FRESH, products: 1, connectedStores: 1 };
    expect(gettingStarted(ready, WEB).nextStep).toBe(GettingStartedStep.Publish);

    const published = { ...ready, liveListings: 1 };
    expect(gettingStarted(published, WEB).nextStep).toBe(GettingStartedStep.VerifyEmail);
    expect(gettingStarted({ ...published, emailVerified: true }, WEB).nextStep).toBeNull();
  });

  it('asks an unclaimed sandbox to be claimed first, and blocks stores until then', () => {
    const sandbox = { ...FRESH, unclaimedSandbox: true };
    const view = gettingStarted(sandbox, WEB);

    expect(view.nextStep).toBe(GettingStartedStep.ClaimAccount);
    expect(states(sandbox)[GettingStartedStep.ConnectStore]).toBe(GettingStartedStepState.Blocked);
    expect(view.steps.map((step) => step.step)).not.toContain(GettingStartedStep.VerifyEmail);
  });

  it('keeps the counts it was given', () => {
    expect(gettingStarted(FRESH, WEB)).toMatchObject(FRESH);
  });
});
