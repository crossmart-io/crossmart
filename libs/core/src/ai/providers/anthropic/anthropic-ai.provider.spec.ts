import type {
  BetaMessage,
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { APIConnectionError, APIError } from '@anthropic-ai/sdk';
import type { AppConfigService } from '@crossmart/common';
import { z } from 'zod';
import { AiStopReason } from '../../enums/ai-stop-reason.enum.js';
import {
  AiKeyRejectedError,
  AiNotConfiguredError,
  AiProviderUnavailableError,
} from '../../errors/ai.errors.js';
import { AnthropicAiProvider } from './anthropic-ai.provider.js';
import type { AnthropicClientFactory, AnthropicMessages } from './anthropic-client.factory.js';
import { REFUSAL_FALLBACK_BETA } from './anthropic.constants.js';

const REQUEST = {
  system: 'You write titles.',
  prompt: 'A mug',
  schema: z.object({ title: z.string().max(80) }),
  maxOutputTokens: 1000,
};

function message(overrides: Partial<BetaMessage> = {}): BetaMessage {
  return {
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5-5',
    content: [{ type: 'text', text: '{"title":"Mug"}', citations: null }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 321, output_tokens: 54 },
    ...overrides,
  } as BetaMessage;
}

function setup(apiKey: string | null, model = 'claude-sonnet-5-5') {
  const create = vi.fn<AnthropicMessages['create']>().mockResolvedValue(message());
  const factory = { create: vi.fn(() => ({ create })) };
  const config = { aiSettings: { anthropicApiKey: apiKey, model } } as AppConfigService;
  const provider = new AnthropicAiProvider(config, factory as unknown as AnthropicClientFactory);
  return { provider, create, factory };
}

function sentParams(create: ReturnType<typeof setup>['create']): MessageCreateParamsNonStreaming {
  return create.mock.calls[0][0];
}

describe('AnthropicAiProvider', () => {
  it('is not configured without a key, and never builds a client', async () => {
    const { provider, factory } = setup(null);

    expect(provider.isConfigured()).toBe(false);
    expect(factory.create).not.toHaveBeenCalled();
    await expect(provider.complete(REQUEST)).rejects.toThrow(AiNotConfiguredError);
  });

  it('uses the request’s own model when it names one, with or without the refusal fallback', async () => {
    const { provider, create } = setup('sk-test');

    await provider.complete({ ...REQUEST, model: 'claude-haiku-5-5' });

    const params = sentParams(create) as MessageCreateParamsNonStreaming & { betas?: string[] };
    expect(params.model).toBe('claude-haiku-5-5');
    expect(params.betas).toBeUndefined();
  });

  it('asks the configured model for output in the request’s JSON schema', async () => {
    const { provider, create, factory } = setup('sk-test');

    const completion = await provider.complete(REQUEST);

    expect(factory.create).toHaveBeenCalledWith('sk-test');
    const params = sentParams(create);
    expect(params).toMatchObject({
      model: 'claude-sonnet-5-5',
      max_tokens: 1000,
      system: 'You write titles.',
      messages: [{ role: 'user', content: 'A mug' }],
      output_config: { format: { type: 'json_schema' } },
    });
    expect(JSON.stringify(params.output_config?.format?.schema)).toContain('title');
    expect(completion).toEqual({
      text: '{"title":"Mug"}',
      model: 'claude-sonnet-5-5',
      stopReason: AiStopReason.Completed,
      usage: { inputTokens: 321, outputTokens: 54 },
    });
  });

  it('turns on the server-side refusal fallback only for models that take it', async () => {
    const supported = setup('sk-test');
    await supported.provider.complete(REQUEST);
    expect(sentParams(supported.create)).toMatchObject({
      betas: [REFUSAL_FALLBACK_BETA],
      fallbacks: 'default',
    });

    const other = setup('sk-test', 'claude-haiku-5-5');
    await other.provider.complete(REQUEST);
    expect(sentParams(other.create)).not.toHaveProperty('fallbacks');
  });

  it.each([
    ['refusal', AiStopReason.Refused],
    ['max_tokens', AiStopReason.Truncated],
    ['end_turn', AiStopReason.Completed],
  ] as const)('reads stop reason %s as %s', async (stopReason, expected) => {
    const { provider, create } = setup('sk-test');
    create.mockResolvedValue(message({ stop_reason: stopReason }));

    expect((await provider.complete(REQUEST)).stopReason).toBe(expected);
  });

  describe('failures', () => {
    const apiError = (status: number) =>
      APIError.generate(status, { type: 'error' }, 'failed', new Headers());

    it.each([401, 403])(
      'turns a rejected key (%i) into a message for the operator',
      async (status) => {
        const { provider, create } = setup('sk-test');
        create.mockRejectedValue(apiError(status));

        await expect(provider.complete(REQUEST)).rejects.toThrow(AiKeyRejectedError);
      },
    );

    it.each([429, 500, 529])('turns status %i into a retryable outage', async (status) => {
      const { provider, create } = setup('sk-test');
      create.mockRejectedValue(apiError(status));

      await expect(provider.complete(REQUEST)).rejects.toThrow(AiProviderUnavailableError);
    });

    it('turns an unreachable API into a retryable outage', async () => {
      const { provider, create } = setup('sk-test');
      create.mockRejectedValue(new APIConnectionError({ message: 'offline' }));

      await expect(provider.complete(REQUEST)).rejects.toThrow(AiProviderUnavailableError);
    });

    it('lets other errors through unchanged', async () => {
      const { provider, create } = setup('sk-test');
      const bug = new TypeError('bug');
      create.mockRejectedValue(bug);

      await expect(provider.complete(REQUEST)).rejects.toBe(bug);
    });
  });
});
