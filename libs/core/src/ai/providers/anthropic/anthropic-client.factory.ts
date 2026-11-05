import Anthropic from '@anthropic-ai/sdk';
import type {
  BetaMessage,
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { Injectable } from '@nestjs/common';
import { ANTHROPIC_MAX_RETRIES, ANTHROPIC_TIMEOUT_MS } from './anthropic.constants.js';

/** The one Anthropic call Crossmart makes, so tests can stand in for the SDK. */
export interface AnthropicMessages {
  create(params: MessageCreateParamsNonStreaming): Promise<BetaMessage>;
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
    };
  }
}
