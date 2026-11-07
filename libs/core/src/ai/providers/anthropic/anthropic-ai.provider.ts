import type {
  BetaMessage,
  BetaMessageStreamParams,
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { APIError, AuthenticationError, PermissionDeniedError } from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import type { AiCompletion, AiStructuredRequest } from '../../entities/ai-completion.js';
import type {
  AiConversationListener,
  AiConversationReply,
  AiConversationRequest,
} from '../../entities/ai-conversation.js';
import { AiProviderName } from '../../enums/ai-provider-name.enum.js';
import { AiStopReason } from '../../enums/ai-stop-reason.enum.js';
import {
  AiKeyRejectedError,
  AiNotConfiguredError,
  AiProviderUnavailableError,
} from '../../errors/ai.errors.js';
import { AiProvider } from '../ai-provider.js';
import { type AnthropicMessages, AnthropicClientFactory } from './anthropic-client.factory.js';
import {
  fromAnthropicMessage,
  toAnthropicMessages,
  toAnthropicTools,
} from './anthropic-conversation.mapper.js';
import {
  ANTHROPIC_CONVERSATION_CACHE,
  ANTHROPIC_EFFORT,
  ANTHROPIC_STOP_REASONS,
  REFUSAL_FALLBACK_BETA,
  REFUSAL_FALLBACK_MODELS,
  REFUSAL_FALLBACKS,
  TEXT_BLOCK_TYPE,
  USER_ROLE,
} from './anthropic.constants.js';

/**
 * Claude through the official SDK. Output is constrained to the request's JSON schema
 * (structured outputs); `AiGateway` still validates it, as for any provider.
 */
@Injectable()
export class AnthropicAiProvider extends AiProvider {
  readonly name = AiProviderName.Anthropic;
  readonly model: string;
  private readonly logger = new Logger(AnthropicAiProvider.name);
  private readonly messages: AnthropicMessages | null;

  constructor(config: AppConfigService, clients: AnthropicClientFactory) {
    super();
    const { anthropicApiKey, model } = config.aiSettings;
    this.model = model;
    this.messages = anthropicApiKey ? clients.create(anthropicApiKey) : null;
  }

  isConfigured(): boolean {
    return this.messages !== null;
  }

  async complete<Output>(request: AiStructuredRequest<Output>): Promise<AiCompletion> {
    if (!this.messages) {
      throw new AiNotConfiguredError();
    }
    try {
      return this.toCompletion(await this.messages.create(this.toParams(request)));
    } catch (error) {
      throw this.toError(error);
    }
  }

  async converse(
    request: AiConversationRequest,
    listener: AiConversationListener,
  ): Promise<AiConversationReply> {
    if (!this.messages) {
      throw new AiNotConfiguredError();
    }
    try {
      const message = await this.messages.stream(this.toConversationParams(request), {
        signal: request.signal,
        onText: (delta) => listener.onTextDelta(delta),
      });
      return fromAnthropicMessage(message);
    } catch (error) {
      throw this.toError(error);
    }
  }

  /** The SDK's failures as errors callers understand. Never logs the request or the key. */
  private toError(error: unknown): unknown {
    if (!(error instanceof APIError)) return error;
    this.logger.warn(`Anthropic request failed with status ${error.status ?? 'none'}`);
    if (error instanceof AuthenticationError || error instanceof PermissionDeniedError) {
      return new AiKeyRejectedError();
    }
    return new AiProviderUnavailableError(error.status);
  }

  private toParams<Output>(request: AiStructuredRequest<Output>): MessageCreateParamsNonStreaming {
    const format = zodOutputFormat(request.schema);
    const model = request.model ?? this.model;
    return {
      model,
      max_tokens: request.maxOutputTokens,
      system: request.system,
      messages: [{ role: USER_ROLE, content: request.prompt }],
      output_config: {
        effort: ANTHROPIC_EFFORT,
        format: { type: format.type, schema: format.schema },
      },
      ...this.refusalFallback(model),
    };
  }

  /** Streamed, so long answers never hit the HTTP timeout, and cached up to the newest message. */
  private toConversationParams(request: AiConversationRequest): BetaMessageStreamParams {
    const model = request.model ?? this.model;
    return {
      model,
      max_tokens: request.maxOutputTokens,
      system: request.system,
      messages: toAnthropicMessages(request.messages),
      tools: toAnthropicTools(request.tools),
      cache_control: ANTHROPIC_CONVERSATION_CACHE,
      output_config: { effort: ANTHROPIC_EFFORT },
      ...this.refusalFallback(model),
    };
  }

  private refusalFallback(model: string): Pick<BetaMessageStreamParams, 'betas' | 'fallbacks'> {
    return REFUSAL_FALLBACK_MODELS.has(model)
      ? { betas: [REFUSAL_FALLBACK_BETA], fallbacks: REFUSAL_FALLBACKS }
      : {};
  }

  private toCompletion(message: BetaMessage): AiCompletion {
    const text = message.content
      .flatMap((block) => (block.type === TEXT_BLOCK_TYPE ? [block.text] : []))
      .join('');
    return {
      text,
      model: message.model,
      stopReason: this.toStopReason(message),
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }

  private toStopReason(message: BetaMessage): AiStopReason {
    const reason = message.stop_reason;
    return (reason && ANTHROPIC_STOP_REASONS[reason]) ?? AiStopReason.Completed;
  }
}
