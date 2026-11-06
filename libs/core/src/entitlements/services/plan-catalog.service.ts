import { Injectable } from '@nestjs/common';
import type { OfferedPlan } from '../entities/offered-plan.js';
import {
  type OfferedPlanRecord,
  PlanCatalogRepository,
} from '../repositories/plan-catalog.repository.js';
import { toFeatureGrants } from '../rules/feature-grants.js';

/**
 * The public plan lineup: what each offered plan grants, read from the plan data so nothing
 * repeats plan names or limits. Prices are not here; billing owns them.
 */
@Injectable()
export class PlanCatalogService {
  constructor(private readonly plans: PlanCatalogRepository) {}

  async listOffered(): Promise<OfferedPlan[]> {
    const records = await this.plans.findOffered();
    return records.flatMap((record) => PlanCatalogService.toOfferedPlan(record));
  }

  /** A plan without any version yet is left out: it grants nothing to describe. */
  private static toOfferedPlan(record: OfferedPlanRecord): OfferedPlan[] {
    const [latest] = record.versions;
    if (!latest) return [];
    return [
      {
        code: record.code,
        name: record.name,
        version: latest.version,
        grants: toFeatureGrants(latest.features),
      },
    ];
  }
}
