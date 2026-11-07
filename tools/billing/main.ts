/**
 * Makes Stripe sell the offered plans (ADR 0024): a product per plan, its monthly and annual
 * prices by lookup key, and a Customer Portal configuration for switching between them.
 *
 *   pnpm billing:sync-stripe            # a test-mode key only
 *   pnpm billing:sync-stripe --live     # a live account, deliberately
 *
 * Reads `STRIPE_SECRET_KEY` and `DATABASE_URL` from the environment or `.env`. Plans come from the
 * database (the plan lineup migrations), amounts from `plan-prices.json`. Safe to run again:
 * whatever already matches is left alone. Never prints the key.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import Stripe from 'stripe';
import { PrismaClient } from '@crossmart/database/generated/prisma/client.js';
import {
  LIVE_FLAG,
  MISSING_DATABASE_URL,
  MISSING_STRIPE_KEY,
  NOT_TEST_KEY,
  PLAN_PRICES_FILE,
  TEST_KEY_PREFIXES,
} from './billing-sync.constants.js';
import { readPlanPrices } from './plan-prices.js';
import { StripeCatalogSync, type SyncPlan } from './stripe-catalog.sync.js';

/** A CLI reports on stdout; the API's structured logger is for servers. */
function report(line: string): void {
  process.stdout.write(`${line}\n`);
}

function required(value: string | undefined, missing: string): string {
  if (!value) throw new Error(missing);
  return value;
}

function stripeKey(): string {
  const secretKey = required(process.env.STRIPE_SECRET_KEY, MISSING_STRIPE_KEY);
  const isTestKey = TEST_KEY_PREFIXES.some((prefix) => secretKey.startsWith(prefix));
  if (!isTestKey && !process.argv.includes(LIVE_FLAG)) throw new Error(NOT_TEST_KEY);
  return secretKey;
}

/** The plans new organizations can choose, in their order. */
async function offeredPlans(): Promise<SyncPlan[]> {
  const connectionString = required(process.env.DATABASE_URL, MISSING_DATABASE_URL);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    return await prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, name: true },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const stripe = new Stripe(stripeKey());
  const [plans, prices] = await Promise.all([offeredPlans(), readPlanPrices(PLAN_PRICES_FILE)]);
  const portalId = await new StripeCatalogSync(stripe, report).sync(plans, prices);
  report(`Done. Set STRIPE_PORTAL_CONFIGURATION_ID=${portalId} to let customers switch plans.`);
}

await main();
