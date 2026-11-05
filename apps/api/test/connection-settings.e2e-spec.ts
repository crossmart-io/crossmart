import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { ChannelType } from '@crossmart/connectors';
import {
  ChannelConnectionRepository,
  CompareAtMode,
  ConnectionRulesService,
  PriceRounding,
  type PricingRule,
} from '@crossmart/core';
import { type Prisma, PrismaService } from '@crossmart/database';
import { createTestApp, signUp } from './support/test-app.js';

const PRICING: PricingRule = {
  adjustmentPercent: '15',
  fixedAmount: '0',
  rounding: PriceRounding.Ending99,
  floor: null,
  compareAt: CompareAtMode.Adjust,
};
const SELECTION = { filter: { tags: ['summer'] }, includeProductIds: [], excludeProductIds: [] };
const CONCURRENT_WRITES = 6;

describe('Connection settings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let records: ChannelConnectionRepository;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    records = app.get(ChannelConnectionRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  async function connection(workspaceId: string, settings: Prisma.InputJsonObject = {}) {
    return prisma.channelConnection.create({
      data: {
        workspaceId,
        channel: ChannelType.Ebay,
        externalAccountId: randomUUID(),
        displayName: 'Settings store',
        settings,
      },
    });
  }

  async function storedSettings(connectionId: string): Promise<Prisma.JsonValue> {
    const row = await prisma.channelConnection.findUniqueOrThrow({ where: { id: connectionId } });
    return row.settings;
  }

  it('keeps a pricing rule saved while an account write was in flight', async () => {
    const { workspaceId } = await signUp(app, 'Settings Seller');
    const { id } = await connection(workspaceId, { account: { channel: ChannelType.Ebay } });

    // An account write that read the settings before the pricing save, as eBay setup does
    // around its channel calls, lands after it.
    await records.savePricing(workspaceId, id, PRICING);
    const account = { channel: ChannelType.Ebay, listingDefaults: { condition: 'NEW' } };
    await records.saveAccountSettings(workspaceId, id, account);

    expect(await storedSettings(id)).toEqual({
      account: { channel: ChannelType.Ebay, listingDefaults: { condition: 'NEW' } },
      pricing: PRICING,
    });
  });

  it('applies concurrent account, pricing, selection and exclusion writes without losing any', async () => {
    const { workspaceId } = await signUp(app, 'Racing Seller');
    const { id } = await connection(workspaceId, { productSelection: SELECTION });
    const excluded = Array.from({ length: CONCURRENT_WRITES }, () => randomUUID());
    const rules = app.get(ConnectionRulesService);

    await Promise.all([
      ...excluded.map((productId) =>
        rules.changeExclusions(workspaceId, id, { exclude: [productId] }),
      ),
      records.saveAccountSettings(workspaceId, id, { channel: ChannelType.Ebay }),
      records.savePricing(workspaceId, id, PRICING),
    ]);

    const settings = (await storedSettings(id)) as Prisma.JsonObject;
    expect(settings.account).toEqual({ channel: ChannelType.Ebay });
    expect(settings.pricing).toEqual(PRICING);
    const selection = settings.productSelection as Prisma.JsonObject;
    expect([...(selection.excludeProductIds as string[])].sort()).toEqual([...excluded].sort());
  });

  it('ignores writes to a connection of another workspace', async () => {
    const owner = await signUp(app, 'Owner');
    const intruder = await signUp(app, 'Intruder');
    const { id } = await connection(owner.workspaceId, { pricing: PRICING });

    await expect(records.savePricing(intruder.workspaceId, id, null)).resolves.toBeNull();
    expect(await storedSettings(id)).toEqual({ pricing: PRICING });
  });

  it('keeps the rules and the merchant account choices when the account connects again', async () => {
    const { workspaceId } = await signUp(app, 'Reconnecting Seller');
    const stored = await connection(workspaceId, {
      account: { channel: ChannelType.Ebay, currencyCode: 'USD', listingDefaults: { lot: 1 } },
      productSelection: SELECTION,
      pricing: PRICING,
    });

    const member = await prisma.workspaceMember.findFirstOrThrow({ where: { workspaceId } });
    await records.upsertConnected({
      workspaceId,
      channel: ChannelType.Ebay,
      externalAccountId: stored.externalAccountId,
      displayName: 'Settings store',
      sealedCredentials: 'sealed',
      credentialsExpiresAt: null,
      grantedScopes: [],
      settings: {
        account: { channel: ChannelType.Ebay, currencyCode: 'GBP' },
        productSelection: null,
        pricing: null,
      },
      connectedById: member.userId,
      connectedAt: new Date(),
    });

    expect(await storedSettings(stored.id)).toEqual({
      account: { channel: ChannelType.Ebay, currencyCode: 'GBP', listingDefaults: { lot: 1 } },
      productSelection: SELECTION,
      pricing: PRICING,
    });
  });
});
