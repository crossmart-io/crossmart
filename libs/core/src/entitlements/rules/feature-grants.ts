import { FEATURE_KINDS, UNLIMITED } from '../entitlements.constants.js';
import type { FeatureGrant } from '../entities/plan-snapshot.js';
import { FeatureKind } from '../enums/feature-kind.enum.js';
import { Feature } from '../enums/feature.enum.js';

/** A feature row of a plan version, as stored. */
export interface StoredFeature {
  feature: string;
  enabled: boolean;
  limit: number | null;
}

const NOT_INCLUDED_LIMIT = 0;

/** A feature the version does not list, or lists as disabled: not included, so nothing allowed. */
function notIncluded(feature: Feature): FeatureGrant {
  return { feature, kind: FEATURE_KINDS[feature], enabled: false, limit: NOT_INCLUDED_LIMIT };
}

function toGrant(feature: Feature, stored: StoredFeature | undefined): FeatureGrant {
  if (!stored?.enabled) return notIncluded(feature);
  const kind = FEATURE_KINDS[feature];
  return {
    feature,
    kind,
    enabled: true,
    limit: kind === FeatureKind.Flag ? UNLIMITED : stored.limit,
  };
}

/**
 * What a plan version grants for every feature this version of Crossmart knows. Stored rows for
 * features it does not know (added by a newer release) are ignored.
 */
export function toFeatureGrants(stored: readonly StoredFeature[]): Map<Feature, FeatureGrant> {
  const byFeature = new Map(stored.map((row) => [row.feature, row]));
  return new Map(
    Object.values(Feature).map((feature) => [feature, toGrant(feature, byFeature.get(feature))]),
  );
}
