import { z } from 'zod';
import type { ChannelConnector, ChannelSettings } from '@crossmart/connectors';
import { type ProductSelectionRule, productSelectionRuleSchema } from './product-selection.js';

/**
 * Everything stored in a connection's `settings` column: the account as its connector read
 * it, and Crossmart's own rules for the connection. New rules are new optional fields here.
 */
export interface ConnectionSettings {
  /** Validated by the channel's connector; null until the account has been read. */
  account: ChannelSettings | null;
  /** Null until the merchant chooses products; the publish flow then lists all of them. */
  productSelection: ProductSelectionRule | null;
}

const storedSettingsSchema = z.object({
  account: z.unknown().optional(),
  productSelection: productSelectionRuleSchema.nullable().optional(),
});

/** Reads stored settings, letting the connector validate its own part. Throws on bad data. */
export function parseConnectionSettings(
  connector: ChannelConnector,
  raw: unknown,
): ConnectionSettings {
  const stored = storedSettingsSchema.parse(raw ?? {});
  return {
    account:
      stored.account === undefined || stored.account === null
        ? null
        : connector.parseSettings(stored.account),
    productSelection: stored.productSelection ?? null,
  };
}

export function emptyConnectionSettings(): ConnectionSettings {
  return { account: null, productSelection: null };
}
