import { parseArgs } from 'node:util';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfigModule } from '@crossmart/common';
import {
  BillingModule,
  SubscriptionResyncService,
  type SubscriptionResyncResult,
} from '@crossmart/core';
import { DatabaseModule } from '@crossmart/database';
import {
  ARGUMENTS_SEPARATOR,
  BILLING_RESYNC_FLAG,
  RESYNC_ALL_OPTION,
  RESYNC_LOG_CONTEXT,
  RESYNC_ORG_OPTION,
  RESYNC_USAGE,
  SCRIPT_ARGUMENTS_START,
} from './billing.constants.js';

/** Which organizations to resync: the ones named, or every one with a subscription. */
export type ResyncTarget = { all: true } | { all: false; organizationIds: string[] };

/** Whether the process was started to resync subscriptions rather than to serve the API. */
export function isBillingResync(argv: readonly string[]): boolean {
  return argv.includes(`${ARGUMENTS_SEPARATOR}${BILLING_RESYNC_FLAG}`);
}

/** Reads `--org <id>` (repeatable) or `--all`, exactly one of them; throws the usage otherwise. */
export function parseResyncTarget(args: readonly string[]): ResyncTarget {
  const { values } = parseArgs({
    args: args.filter((argument) => argument !== ARGUMENTS_SEPARATOR),
    options: {
      [BILLING_RESYNC_FLAG]: { type: 'boolean' },
      [RESYNC_ORG_OPTION]: { type: 'string', multiple: true },
      [RESYNC_ALL_OPTION]: { type: 'boolean' },
    },
  });
  const organizationIds = values[RESYNC_ORG_OPTION] ?? [];
  const all = values[RESYNC_ALL_OPTION] ?? false;
  if (all === organizationIds.length > 0) throw new Error(RESYNC_USAGE);
  return all ? { all } : { all, organizationIds };
}

/** One line per organization: its id, what happened, and the subscription read. */
export function describeResync(result: SubscriptionResyncResult): string {
  return [result.organizationId, result.outcome, result.subscriptionId].filter(Boolean).join(' ');
}

/** The target's results, one organization after another. */
export function resyncTarget(
  service: Pick<SubscriptionResyncService, 'resync' | 'resyncAll'>,
  target: ResyncTarget,
): AsyncIterable<SubscriptionResyncResult> {
  return target.all ? service.resyncAll() : resyncEach(service, target.organizationIds);
}

async function* resyncEach(
  service: Pick<SubscriptionResyncService, 'resync'>,
  organizationIds: readonly string[],
): AsyncGenerator<SubscriptionResyncResult> {
  for (const organizationId of organizationIds) yield await service.resync(organizationId);
}

/** Only what the resync needs: no HTTP server and no queue processors. */
@Module({ imports: [AppConfigModule, DatabaseModule, BillingModule] })
class BillingResyncModule {}

/**
 * Reads organizations' subscriptions from the billing provider and applies them as its webhooks
 * do (ADR 0024), to repair a row a missed or misread webhook left behind; logs each and exits.
 * Run it where the API runs, so it has the API's database and provider keys (docs/billing.md).
 * Safe to repeat: it only writes what the provider holds now.
 */
export async function resyncSubscriptions(): Promise<void> {
  const target = parseResyncTarget(process.argv.slice(SCRIPT_ARGUMENTS_START));
  const app = await NestFactory.createApplicationContext(BillingResyncModule);
  try {
    const service = app.get(SubscriptionResyncService);
    for await (const result of resyncTarget(service, target)) {
      Logger.log(describeResync(result), RESYNC_LOG_CONTEXT);
    }
  } finally {
    await app.close();
  }
}
