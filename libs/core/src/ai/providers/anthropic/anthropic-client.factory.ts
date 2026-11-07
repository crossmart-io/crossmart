import Anthropic from '@anthropic-ai/sdk';
import type {
  BetaMessage,
  BetaMessageStreamParams,
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { Injectable } from '@nestjs/common';
import { ANTHROPIC_MAX_RETRIES, ANTHROPIC_TIMEOUT_MS } from './anthropic.constants.js';

/** How a streamed call reports progress and can be stopped. */
export interface AnthropicStreamOptions {
  signal?: AbortSignal;
  onText: (delta: string) => void;
}

/** The Anthropic calls Crossmart makes, so tests can stand in for the SDK. */
export interface AnthropicMessages {
  create(params: MessageCreateParamsNonStreaming): Promise<BetaMessage>;
  /** Streams the answer's text to `onText`, then resolves with the whole message. */
  stream(params: BetaMessageStreamParams, options: AnthropicStreamOptions): Promise<BetaMessage>;
}

/** Builds the SDK client. The key is passed in, never read from the environment here. */
@Injectable()
export class AnthropicClientFactory {
  create(apiKey: string): AnthropicMessages {
    const client = new Anthropic({
      apiKey,
      timeout: ANTHROPIC_TIMEOUT_MS,
      maxRetries: ANTHROPIC_MAX_RETRIES,
    });
    return {
      create: (params) => client.beta.messages.create(params),
      stream: (params, { signal, onText }) =>
        client.beta.messages.stream(params, { signal }).on('text', onText).finalMessage(),
    };
  }
}
