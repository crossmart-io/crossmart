import type { AiCompletion, AiStructuredRequest } from '../entities/ai-completion.js';
import type {
  AiContentBlock,
  AiConversationListener,
  AiConversationReply,
  AiConversationRequest,
} from '../entities/ai-conversation.js';
import { AiContentBlockType } from '../enums/ai-content-block-type.enum.js';
import { AiProviderName } from '../enums/ai-provider-name.enum.js';
import { AiStopReason } from '../enums/ai-stop-reason.enum.js';
import { AiNotConfiguredError } from '../errors/ai.errors.js';
import { AiProvider } from '../providers/ai-provider.js';

export const FAKE_AI_MODEL = 'fake-model';
export const FAKE_AI_USAGE = { inputTokens: 120, outputTokens: 80 };

/**
 * An `AiProvider` that answers from a script, for tests. No test calls a real AI API.
 * Queue answers with `answerWith`; each call takes the next one, or repeats the last.
 */
export class FakeAiProvider extends AiProvider {
  readonly name = AiProviderName.Anthropic;
  readonly model = FAKE_AI_MODEL;
  readonly requests: AiStructuredRequest<unknown>[] = [];
  private readonly answers: AiCompletion[] = [];
  /** Every conversation call, with the messages as they were sent. */
  readonly conversationRequests: AiConversationRequest[] = [];
  private readonly replies: (AiConversationReply | Error)[] = [];

  constructor(private configured = true) {
    super();
  }

  isConfigured(): boolean {
    return this.configured;
  }

  setConfigured(configured: boolean): void {
    this.configured = configured;
  }

  /** Answers the next calls with this output, serialized as the model would. */
  answerWith(output: unknown, stopReason = AiStopReason.Completed): this {
    return this.answerWithText(JSON.stringify(output), stopReason);
  }

  /** Forgets the queued answers, so the next `answerWith` is the next call's answer. */
  clearAnswers(): this {
    this.answers.length = 0;
    return this;
  }

  answerWithText(text: string, stopReason = AiStopReason.Completed): this {
    this.answers.push({ text, model: FAKE_AI_MODEL, stopReason, usage: FAKE_AI_USAGE });
    return this;
  }

  complete<Output>(request: AiStructuredRequest<Output>): Promise<AiCompletion> {
    if (!this.configured) {
      return Promise.reject(new AiNotConfiguredError());
    }
    this.requests.push(request);
    const answer = this.answers.length > 1 ? this.answers.shift() : this.answers[0];
    if (!answer) {
      return Promise.reject(new Error('FakeAiProvider has no answer queued'));
    }
    return Promise.resolve(answer);
  }

  /**
   * Answers the next conversation call with these blocks: text is streamed in one delta, and the
   * reply stops for tools when it has tool uses. Each call takes the next reply.
   */
  replyWith(content: AiContentBlock[]): this {
    const usesTools = content.some((block) => block.type === AiContentBlockType.ToolUse);
    this.replies.push({
      content,
      model: FAKE_AI_MODEL,
      stopReason: usesTools ? AiStopReason.ToolUse : AiStopReason.Completed,
      usage: FAKE_AI_USAGE,
    });
    return this;
  }

  /** Fails the next conversation call with `error`, such as a provider outage. */
  failNextWith(error: Error): this {
    this.replies.push(error);
    return this;
  }

  clearReplies(): this {
    this.replies.length = 0;
    this.conversationRequests.length = 0;
    return this;
  }

  converse(
    request: AiConversationRequest,
    listener: AiConversationListener,
  ): Promise<AiConversationReply> {
    if (!this.configured) {
      return Promise.reject(new AiNotConfiguredError());
    }
    this.conversationRequests.push({ ...request, messages: structuredClone(request.messages) });
    const reply = this.replies.shift();
    if (!reply) {
      return Promise.reject(new Error('FakeAiProvider has no conversation reply queued'));
    }
    if (reply instanceof Error) return Promise.reject(reply);
    for (const block of reply.content) {
      if (block.type === AiContentBlockType.Text) listener.onTextDelta(block.text);
    }
    return Promise.resolve(reply);
  }
}
