import { Injectable } from '@nestjs/common';
import { Feature } from '../enums/feature.enum.js';
import { type OrganizationScope, UsageRepository } from '../repositories/usage.repository.js';

type Counter = (scope: OrganizationScope) => Promise<number>;

const NOTHING_METERED = 0;

/**
 * Measures what an organization uses of each counted feature, from the data itself: nothing is
 * stored, so usage can never drift from what exists. Flags are not counted.
 */
@Injectable()
export class UsageMeter {
  private readonly counters: Readonly<Record<Feature, Counter | null>>;

  constructor(private readonly usage: UsageRepository) {
    this.counters = {
      [Feature.ActiveListings]: (scope) => this.usage.countActiveListings(scope),
      [Feature.ChannelConnections]: (scope) => this.usage.countChannelConnections(scope),
      [Feature.Workspaces]: (scope) => Promise.resolve(scope.workspaceIds.length),
      [Feature.Members]: (scope) => this.usage.countMembers(scope),
      [Feature.ApiKeys]: (scope) => this.usage.countActiveApiKeys(scope, new Date()),
      // Not metered yet. Once AI calls write usage records (the `ai_usage` table), sum the
      // credits the organization's workspaces used since the start of the billing period here.
      [Feature.AiCredits]: () => Promise.resolve(NOTHING_METERED),
      [Feature.AutonomousAgents]: null,
      [Feature.BringYourOwnKey]: null,
    };
  }

  organizationIdOf(workspaceId: string): Promise<string> {
    return this.usage.organizationIdOf(workspaceId);
  }

  scopeOf(organizationId: string): Promise<OrganizationScope> {
    return this.usage.scopeOf(organizationId);
  }

  /** What is in use of a counted feature; null for flags. */
  count(scope: OrganizationScope, feature: Feature): Promise<number | null> {
    const counter = this.counters[feature];
    return counter ? counter(scope) : Promise.resolve(null);
  }

  /** Every feature's usage at once, the counts running in parallel. */
  async countAll(
    scope: OrganizationScope,
    features: readonly Feature[],
  ): Promise<Map<Feature, number | null>> {
    const counts = await Promise.all(features.map((feature) => this.count(scope, feature)));
    return new Map(features.map((feature, index) => [feature, counts[index] ?? null]));
  }
}
