import type { AiCompletion, AiStructuredRequest } from '../entities/ai-completion.js';
import type {
  AiConversationListener,
  AiConversationReply,
  AiConversationRequest,
} from '../entities/ai-conversation.js';
import type { AiProviderName } from '../enums/ai-provider-name.enum.js';

/**
 * A large language model behind one interface, so the provider can be swapped (Anthropic
 * today; OpenAI, Gemini, Ollama or a workspace's own key later). Providers only call the
 * model: metering and validation happen in `AiGateway`, the same for every provider.
 */
export abstract class AiProvider {
  abstract readonly name: AiProviderName;
  /** The model calls are made with. */
  abstract readonly model: string;

  /** False when the provider has no credentials; AI features then report it. */
  abstract isConfigured(): boolean;

  /** Asks for an answer following the request's schema. Never logs the prompt. */
  abstract complete<Output>(request: AiStructuredRequest<Output>): Promise<AiCompletion>;

  /**
   * One call of a conversation with tools, streaming the answer's text to `listener` as it is
   * written. The reply's tool uses are for the caller to run (or not). Never logs the content.
   */
  abstract converse(
    request: AiConversationRequest,
    listener: AiConversationListener,
  ): Promise<AiConversationReply>;
}
