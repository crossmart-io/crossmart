import type { Feature } from '../enums/feature.enum.js';
import type { FeatureGrant } from './plan-snapshot.js';

/** A plan new organizations can choose, at its latest version, as public pages describe it. */
export interface OfferedPlan {
  code: string;
  name: string;
  version: number;
  grants: ReadonlyMap<Feature, FeatureGrant>;
}
