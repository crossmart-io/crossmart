import { FeatureKind } from './enums/feature-kind.enum.js';
import { Feature } from './enums/feature.enum.js';

export const FEATURE_KINDS: Readonly<Record<Feature, FeatureKind>> = {
  [Feature.ActiveListings]: FeatureKind.Limit,
  [Feature.ChannelConnections]: FeatureKind.Limit,
  [Feature.Workspaces]: FeatureKind.Limit,
  [Feature.Members]: FeatureKind.Limit,
  [Feature.ApiKeys]: FeatureKind.Limit,
  [Feature.WebhookEndpoints]: FeatureKind.Limit,
  [Feature.AiCredits]: FeatureKind.Limit,
  [Feature.AutonomousAgents]: FeatureKind.Flag,
  [Feature.BringYourOwnKey]: FeatureKind.Flag,
};

/** How a feature reads in messages, for one and for many. */
export interface FeatureNoun {
  one: string;
  other: string;
}

export const FEATURE_NOUNS: Readonly<Record<Feature, FeatureNoun>> = {
  [Feature.ActiveListings]: { one: 'active listing', other: 'active listings' },
  [Feature.ChannelConnections]: { one: 'connected channel', other: 'connected channels' },
  [Feature.Workspaces]: { one: 'workspace', other: 'workspaces' },
  [Feature.Members]: { one: 'member', other: 'members' },
  [Feature.ApiKeys]: { one: 'API key', other: 'API keys' },
  [Feature.WebhookEndpoints]: { one: 'webhook endpoint', other: 'webhook endpoints' },
  [Feature.AiCredits]: { one: 'AI credit', other: 'AI credits' },
  [Feature.AutonomousAgents]: { one: 'autonomous agent', other: 'Autonomous agents' },
  [Feature.BringYourOwnKey]: { one: 'own AI key', other: 'Your own AI keys' },
};

/** The reason phrase of HTTP 402, as NestJS errors carry it in `error`. */
export const PAYMENT_REQUIRED_ERROR = 'Payment Required';
/** What a limit with no value means: there is none. */
export const UNLIMITED = null;
/** The plans are seeded by a migration; without a default one, organizations cannot be created. */
export const NO_DEFAULT_PLAN = 'No default plan is set up. Run the database migrations.';

/**
 * What one AI call costs in `Feature.AiCredits`. Every call is one credit for now, whatever its
 * size; pricing by tokens may replace it later, metered from the same `ai_usage` records.
 */
export const AI_CREDITS_PER_CALL = 1;

/** The reason phrase of HTTP 403, as NestJS errors carry it in `error`. */
export const FORBIDDEN_ERROR = 'Forbidden';
/** The most products an unclaimed sandbox account may hold (ADR 0019); claiming lifts it. */
export const SANDBOX_MAX_PRODUCTS = 100;
