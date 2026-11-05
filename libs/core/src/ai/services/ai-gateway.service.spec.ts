import { z } from 'zod';
import type { AiUsageRecordInput } from '../entities/ai-usage.js';
import { AiFeature } from '../enums/ai-feature.enum.js';
import { AiProviderName } from '../enums/ai-provider-name.enum.js';
import { AiStopReason } from '../enums/ai-stop-reason.enum.js';
import { AiNotConfiguredError, AiOutputRejectedError } from '../errors/ai.errors.js';
import { FAKE_AI_MODEL, FAKE_AI_USAGE, FakeAiProvider } from '../testing/fake-ai.provider.js';
import { AiGateway } from './ai-gateway.service.js';
import type { AiUsageService } from './ai-usage.service.js';

const CONTEXT = { workspaceId: 'ws-1', feature: AiFeature.ContentGeneration };
const REQUEST = {
  system: 'You write titles.',
  prompt: 'A mug',
  schema: z.object({ title: z.string() }),
  maxOutputTokens: 100,
};

function setup(provider = new FakeAiProvider()) {
  const recorded: AiUsageRecordInput[] = [];
  const usage = {
    record: vi.fn((input: AiUsageRecordInput) => {
      recorded.push(input);
      return Promise.resolve();
    }),
  };
  const gateway = new AiGateway(provider, usage as unknown as AiUsageService);
  return { gateway, provider, recorded };
}

describe('AiGateway', () => {
  it('returns the validated answer and meters the call', async () => {
    const { gateway, provider, recorded } = setup();
    provider.answerWith({ title: 'Stoneware Mug' });

    const generation = await gateway.generate(CONTEXT, REQUEST);

    expect(generation).toEqual({ output: { title: 'Stoneware Mug' }, model: FAKE_AI_MODEL });
    expect(recorded).toEqual([
      {
        workspaceId: 'ws-1',
        feature: AiFeature.ContentGeneration,
        provider: AiProviderName.Anthropic,
        model: FAKE_AI_MODEL,
        ...FAKE_AI_USAGE,
      },
    ]);
  });

  it('meters a call whose answer it then rejects, as its tokens were spent', async () => {
    const { gateway, provider, recorded } = setup();
    provider.answerWith({ title: 'Mug' }, AiStopReason.Refused);

    await expect(gateway.generate(CONTEXT, REQUEST)).rejects.toThrow(AiOutputRejectedError);
    expect(recorded).toHaveLength(1);
  });

  it('refuses to call, and meters nothing, while AI is not configured', async () => {
    const { gateway, provider, recorded } = setup(new FakeAiProvider(false));

    await expect(gateway.generate(CONTEXT, REQUEST)).rejects.toThrow(AiNotConfiguredError);
    expect(() => gateway.assertConfigured()).toThrow(AiNotConfiguredError);
    expect(provider.requests).toHaveLength(0);
    expect(recorded).toHaveLength(0);
  });

  it('reports whether AI is configured, and with which model', () => {
    expect(setup().gateway.status()).toEqual({
      configured: true,
      provider: AiProviderName.Anthropic,
      model: FAKE_AI_MODEL,
    });
    expect(setup(new FakeAiProvider(false)).gateway.status().configured).toBe(false);
  });
});
