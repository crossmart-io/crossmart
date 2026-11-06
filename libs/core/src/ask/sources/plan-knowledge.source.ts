import { Injectable } from '@nestjs/common';
import type { FeatureGrant } from '../../entitlements/entities/plan-snapshot.js';
import type { OfferedPlan } from '../../entitlements/entities/offered-plan.js';
import { FEATURE_NOUNS } from '../../entitlements/entitlements.constants.js';
import { FeatureKind } from '../../entitlements/enums/feature-kind.enum.js';
import { PlanCatalogService } from '../../entitlements/services/plan-catalog.service.js';
import {
  FEATURE_PERIOD_SUFFIXES,
  INCLUDED_LABEL,
  NOT_INCLUDED_LABEL,
  NUMBER_LOCALE,
  PLANS_CHUNK_ID,
  PLANS_CHUNK_TITLE,
  PRICING_URL,
  UNLIMITED_LABEL,
} from '../ask.constants.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { KnowledgeSourceKind } from '../enums/knowledge-source-kind.enum.js';
import { KnowledgeSource } from './knowledge-source.js';

const LINE = '\n';
const ITEM_SEPARATOR = '; ';
const SINGLE = 1;
const INTRO = [
  'Crossmart Cloud plans, their limits and what each includes. Plans are priced by active ' +
    'listings: a product live in one store is one listing.',
  `Prices, monthly and annual, are on the pricing page: ${PRICING_URL}`,
  'Search terms: pricing, price, cost, plans, tiers, limits, subscription, upgrade.',
];

function limitText(grant: FeatureGrant): string {
  const noun = FEATURE_NOUNS[grant.feature];
  const suffix = FEATURE_PERIOD_SUFFIXES[grant.feature] ?? '';
  if (grant.limit === null) return `${UNLIMITED_LABEL} ${noun.other}${suffix}`;
  const amount = grant.limit.toLocaleString(NUMBER_LOCALE);
  return `${amount} ${grant.limit === SINGLE ? noun.one : noun.other}${suffix}`;
}

function grantText(grant: FeatureGrant): string {
  if (grant.kind === FeatureKind.Flag) {
    return `${FEATURE_NOUNS[grant.feature].other} ${grant.enabled ? INCLUDED_LABEL : NOT_INCLUDED_LABEL}`;
  }
  return limitText(grant);
}

/** One line per plan: "Plan Starter: 1,000 active listings; 3 connected channels; …". */
export function planLine(plan: OfferedPlan): string {
  return `Plan ${plan.name}: ${[...plan.grants.values()].map(grantText).join(ITEM_SEPARATOR)}.`;
}

/**
 * The offered plans as one knowledge chunk, written from the plan data so Ask never repeats a
 * plan name or limit that changed. Prices are not stored with plans, so it links to pricing.
 */
@Injectable()
export class PlanKnowledgeSource extends KnowledgeSource {
  constructor(private readonly plans: PlanCatalogService) {
    super();
  }

  async chunks(): Promise<readonly KnowledgeChunk[]> {
    const offered = await this.plans.listOffered();
    if (!offered.length) return [];
    return [
      {
        id: PLANS_CHUNK_ID,
        source: KnowledgeSourceKind.Plans,
        title: PLANS_CHUNK_TITLE,
        url: PRICING_URL,
        text: [...INTRO, ...offered.map(planLine)].join(LINE),
      },
    ];
  }
}
