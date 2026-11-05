import { FeatureKind } from '../enums/feature-kind.enum.js';
import { Feature } from '../enums/feature.enum.js';
import { TEST_PLAN } from '../testing/entitlement.fixtures.js';
import { evaluateEntitlement } from './evaluate-entitlement.js';

const listings = (limit: number | null, enabled = true) => ({
  feature: Feature.ActiveListings,
  kind: FeatureKind.Limit,
  enabled,
  limit,
});
const agents = (enabled: boolean) => ({
  feature: Feature.AutonomousAgents,
  kind: FeatureKind.Flag,
  enabled,
  limit: null,
});

describe('evaluateEntitlement', () => {
  const evaluate = (grant: ReturnType<typeof listings>, usage: number, requested: number) =>
    evaluateEntitlement({ plan: TEST_PLAN, grant, usage, requested }).allowed;

  it('allows what fits the limit, up to and including it', () => {
    expect(evaluate(listings(50), 49, 1)).toBe(true);
    expect(evaluate(listings(50), 50, 1)).toBe(false);
    expect(evaluate(listings(50), 40, 10)).toBe(true);
    expect(evaluate(listings(50), 40, 11)).toBe(false);
  });

  it('allows anything without a limit, and nothing more of a feature not included', () => {
    expect(evaluate(listings(null), 1_000_000, 500)).toBe(true);
    expect(evaluate(listings(0, false), 0, 1)).toBe(false);
  });

  it('never refuses asking for nothing more, even past the limit', () => {
    expect(evaluate(listings(50), 80, 0)).toBe(true);
  });

  it('allows a flag only when the plan turns it on', () => {
    const check = (enabled: boolean) =>
      evaluateEntitlement({ plan: TEST_PLAN, grant: agents(enabled), usage: 0, requested: 1 });
    expect(check(true).allowed).toBe(true);
    expect(check(false)).toMatchObject({ allowed: false, kind: FeatureKind.Flag });
  });

  it('reports what it decided on', () => {
    expect(
      evaluateEntitlement({ plan: TEST_PLAN, grant: listings(50), usage: 50, requested: 3 }),
    ).toEqual({
      feature: Feature.ActiveListings,
      kind: FeatureKind.Limit,
      plan: TEST_PLAN,
      allowed: false,
      enabled: true,
      limit: 50,
      usage: 50,
      requested: 3,
    });
  });
});
