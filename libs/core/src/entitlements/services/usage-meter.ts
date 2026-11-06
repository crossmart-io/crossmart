import { Injectable } from '@nestjs/common';
import { utcMonthContaining } from '@crossmart/common';
import { AI_CREDITS_PER_CALL } from '../entitlements.constants.js';
import { Feature } from '../enums/feature.enum.js';
import { type OrganizationScope, UsageRepository } from '../repositories/usage.repository.js';

type Counter = (scope: OrganizationScope) => Promise<number>;

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
      [Feature.AiCredits]: (scope) => this.countAiCredits(scope),
      [Feature.AutonomousAgents]: null,
      [Feature.BringYourOwnKey]: null,
    };
  }

  /**
   * Credits the organization's workspaces spent this period, from the `ai_usage` records. The
   * period is the UTC calendar month until billing periods are connected.
   */
  private async countAiCredits(scope: OrganizationScope): Promise<number> {
    const calls = await this.usage.countAiCalls(scope, utcMonthContaining(new Date()));
    return calls * AI_CREDITS_PER_CALL;
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
