import { toFeatureGrants } from '../../entitlements/rules/feature-grants.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { PlanCatalogService } from '../../entitlements/services/plan-catalog.service.js';
import { PRICING_URL } from '../ask.constants.js';
import { KnowledgeSourceKind } from '../enums/knowledge-source-kind.enum.js';
import { PlanKnowledgeSource, planLine } from './plan-knowledge.source.js';

const PLAN = {
  code: 'test-plan',
  name: 'Test Plan',
  version: 3,
  grants: toFeatureGrants([
    { feature: Feature.ActiveListings, enabled: true, limit: 2500 },
    { feature: Feature.Workspaces, enabled: true, limit: 1 },
    { feature: Feature.ChannelConnections, enabled: true, limit: null },
    { feature: Feature.AiCredits, enabled: true, limit: 300 },
    { feature: Feature.AutonomousAgents, enabled: true, limit: null },
  ]),
};

function source(plans: unknown[]) {
  const catalog = { listOffered: vi.fn().mockResolvedValue(plans) };
  return new PlanKnowledgeSource(catalog as unknown as PlanCatalogService);
}

describe('PlanKnowledgeSource', () => {
  it('describes each plan from its data, never from fixed names or numbers', () => {
    const line = planLine(PLAN);

    expect(line).toContain('Plan Test Plan:');
    expect(line).toContain('2,500 active listings');
    expect(line).toContain('1 workspace;');
    expect(line).toContain('unlimited connected channels');
    expect(line).toContain('300 AI credits a month');
    expect(line).toContain('Autonomous agents included');
    expect(line).toContain('Your own AI keys not included');
  });

  it('offers one chunk citing the pricing page', async () => {
    const [chunk] = await source([PLAN]).chunks();

    expect(chunk).toMatchObject({ source: KnowledgeSourceKind.Plans, url: PRICING_URL });
    expect(chunk.text).toContain('Plan Test Plan');
  });

  it('has nothing to say when no plan is offered', async () => {
    expect(await source([]).chunks()).toEqual([]);
  });
});
