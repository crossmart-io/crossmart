import { AiFeature } from '../enums/ai-feature.enum.js';
import { AiProviderName } from '../enums/ai-provider-name.enum.js';
import type { AiUsageRepository } from '../repositories/ai-usage.repository.js';
import type { PlatformAiUsageRepository } from '../repositories/platform-ai-usage.repository.js';
import { AiUsageService } from './ai-usage.service.js';

const PERIOD = { from: new Date('2026-11-01T00:00:00Z'), to: new Date('2026-12-01T00:00:00Z') };

function setup() {
  const repository = {
    create: vi.fn<AiUsageRepository['create']>().mockResolvedValue(),
    sumByFeatureAndModel: vi.fn<AiUsageRepository['sumByFeatureAndModel']>().mockResolvedValue([
      {
        feature: AiFeature.ContentGeneration,
        model: 'a',
        calls: 2,
        inputTokens: 100,
        outputTokens: 40,
      },
      {
        feature: AiFeature.ContentGeneration,
        model: 'b',
        calls: 1,
        inputTokens: 50,
        outputTokens: 10,
      },
      { feature: 'from_a_newer_version', model: 'a', calls: 9, inputTokens: 9, outputTokens: 9 },
    ]),
  };
  const platformRepository = {
    create: vi.fn<PlatformAiUsageRepository['create']>().mockResolvedValue(),
  };
  const service = new AiUsageService(
    repository as unknown as AiUsageRepository,
    platformRepository as unknown as PlatformAiUsageRepository,
  );
  return { repository, platformRepository, service };
}

describe('AiUsageService', () => {
  it('reports usage per feature and model with totals, leaving out unknown features', async () => {
    const { service, repository } = setup();

    const report = await service.report('ws-1', PERIOD);

    expect(repository.sumByFeatureAndModel).toHaveBeenCalledWith('ws-1', PERIOD);
    expect(report.totals).toEqual({ calls: 3, inputTokens: 150, outputTokens: 50 });
    expect(report.lines.map((line) => line.model)).toEqual(['a', 'b']);
    expect(report).toMatchObject(PERIOD);
  });

  it('reports the current UTC month by default', async () => {
    const { service, repository } = setup();

    await service.report('ws-1');

    const [, period] = repository.sumByFeatureAndModel.mock.calls[0];
    expect(period.to.getUTCMonth() - period.from.getUTCMonth()).toBeOneOf([1, -11]);
    expect(period.from.getUTCDate()).toBe(1);
  });

  it('computes a month across a year end', () => {
    expect(AiUsageService.currentMonth(new Date('2026-12-15T10:00:00Z'))).toEqual({
      from: new Date('2026-12-01T00:00:00Z'),
      to: new Date('2027-01-01T00:00:00Z'),
    });
  });

  it('records a call', async () => {
    const { service, repository } = setup();
    const input = {
      workspaceId: 'ws-1',
      feature: AiFeature.ContentGeneration,
      provider: AiProviderName.Anthropic,
      model: 'a',
      inputTokens: 1,
      outputTokens: 2,
    };

    await service.record(input);

    expect(repository.create).toHaveBeenCalledWith(input);
  });

  it('meters platform calls apart from any workspace', async () => {
    const { service, platformRepository, repository } = setup();
    const input = {
      feature: AiFeature.Ask,
      provider: AiProviderName.Anthropic,
      model: 'a',
      inputTokens: 10,
      outputTokens: 5,
    };

    await service.recordPlatform(input);

    expect(platformRepository.create).toHaveBeenCalledWith(input);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
