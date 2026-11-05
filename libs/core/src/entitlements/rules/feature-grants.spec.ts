import { FeatureKind } from '../enums/feature-kind.enum.js';
import { Feature } from '../enums/feature.enum.js';
import { toFeatureGrants } from './feature-grants.js';

describe('toFeatureGrants', () => {
  const grants = toFeatureGrants([
    { feature: Feature.ActiveListings, enabled: true, limit: 50 },
    { feature: Feature.ChannelConnections, enabled: true, limit: null },
    { feature: Feature.AutonomousAgents, enabled: true, limit: 7 },
    { feature: Feature.BringYourOwnKey, enabled: false, limit: null },
    { feature: 'a_feature_from_a_newer_release', enabled: true, limit: 1 },
  ]);

  it('reads limits, with null as unlimited', () => {
    expect(grants.get(Feature.ActiveListings)).toEqual({
      feature: Feature.ActiveListings,
      kind: FeatureKind.Limit,
      enabled: true,
      limit: 50,
    });
    expect(grants.get(Feature.ChannelConnections)?.limit).toBeNull();
  });

  it('gives enabled flags no limit, and disabled features none at all', () => {
    expect(grants.get(Feature.AutonomousAgents)).toMatchObject({
      kind: FeatureKind.Flag,
      enabled: true,
      limit: null,
    });
    expect(grants.get(Feature.BringYourOwnKey)).toMatchObject({ enabled: false, limit: 0 });
  });

  it('treats features the version does not list as not included, and ignores unknown ones', () => {
    expect(grants.get(Feature.Members)).toMatchObject({ enabled: false, limit: 0 });
    expect([...grants.keys()]).toEqual(Object.values(Feature));
  });
});
