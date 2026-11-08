import type {
  BetaMessage,
  BetaMessageStreamParams,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import type { AppConfigService } from '@crossmart/common';
import type { AiConversationRequest } from '../../entities/ai-conversation.js';
import { AiContentBlockType } from '../../enums/ai-content-block-type.enum.js';
import { AiConversationRole } from '../../enums/ai-conversation-role.enum.js';
import { AiProviderName } from '../../enums/ai-provider-name.enum.js';
import { AiStopReason } from '../../enums/ai-stop-reason.enum.js';
import { AnthropicAiProvider } from './anthropic-ai.provider.js';
import type {
  AnthropicClientFactory,
  AnthropicMessages,
  AnthropicStreamOptions,
} from './anthropic-client.factory.js';
import { REFUSAL_FALLBACK_BETA } from './anthropic.constants.js';

const THINKING = { type: 'thinking', thinking: '', signature: 'sig-1' };

const REPLY = {
  id: 'msg_1',
  type: 'message',
  role: 'assistant',
  model: 'claude-sonnet-5-5',
  content: [
    THINKING,
    { type: 'text', text: 'Let me look.', citations: null },
    { type: 'tool_use', id: 'toolu_1', name: 'list_products', input: { search: 'mug' } },
  ],
  stop_reason: 'tool_use',
  stop_sequence: null,
  usage: { input_tokens: 2000, output_tokens: 150 },
} as unknown as BetaMessage;

const REQUEST: AiConversationRequest = {
  system: 'You are Agent Worker.',
  messages: [
    { role: AiConversationRole.User, content: [{ type: AiContentBlockType.Text, text: 'Hi' }] },
    {
      role: AiConversationRole.Assistant,
      content: [
        {
          type: AiContentBlockType.ProviderSpecific,
          provider: AiProviderName.Anthropic,
          value: THINKING,
        },
        { type: AiContentBlockType.ToolUse, id: 'toolu_0', name: 'list_stores', input: {} },
      ],
    },
    {
      role: AiConversationRole.User,
      content: [
        {
          type: AiContentBlockType.ToolResult,
          toolUseId: 'toolu_0',
          content: '[]',
          isError: false,
        },
      ],
    },
  ],
  tools: [{ name: 'list_products', description: 'Products', inputSchema: { type: 'object' } }],
  maxOutputTokens: 8000,
  model: 'claude-sonnet-5-5',
};

function setup() {
  const stream = vi.fn((_params: BetaMessageStreamParams, options: AnthropicStreamOptions) => {
    options.onText('Let me ');
    options.onText('look.');
    return Promise.resolve(REPLY);
  });
  const factory = { create: () => ({ create: vi.fn(), stream }) as unknown as AnthropicMessages };
  const config = {
    aiSettings: { anthropicApiKey: 'sk-test', model: 'claude-haiku-5-5' },
  } as AppConfigService;
  return {
    provider: new AnthropicAiProvider(config, factory as unknown as AnthropicClientFactory),
    stream,
  };
}

describe('AnthropicAiProvider.converse', () => {
  it('streams text, and returns tool calls and reasoning blocks to replay', async () => {
    const { provider } = setup();
    const deltas: string[] = [];

    const reply = await provider.converse(REQUEST, { onTextDelta: (delta) => deltas.push(delta) });

    expect(deltas.join('')).toBe('Let me look.');
    expect(reply.stopReason).toBe(AiStopReason.ToolUse);
    expect(reply.usage).toEqual({ inputTokens: 2000, outputTokens: 150 });
    expect(reply.content.map((block) => block.type)).toEqual([
      AiContentBlockType.ProviderSpecific,
      AiContentBlockType.Text,
      AiContentBlockType.ToolUse,
    ]);
  });

  it('sends the conversation, tools, caching and the refusal fallback as the API takes them', async () => {
    const { provider, stream } = setup();
    await provider.converse(REQUEST, { onTextDelta: () => undefined });

    const params = stream.mock.calls[0]?.[0];
    expect(params).toMatchObject({
      model: 'claude-sonnet-5-5',
      max_tokens: 8000,
      cache_control: { type: 'ephemeral' },
      betas: [REFUSAL_FALLBACK_BETA],
      tools: [{ name: 'list_products', input_schema: { type: 'object' } }],
    });
    expect(params?.messages[1]?.content).toEqual([
      THINKING,
      { type: 'tool_use', id: 'toolu_0', name: 'list_stores', input: {} },
    ]);
    expect(params?.messages[2]?.content).toEqual([
      { type: 'tool_result', tool_use_id: 'toolu_0', content: '[]', is_error: false },
    ]);
  });
});
