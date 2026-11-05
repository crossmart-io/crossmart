import { Injectable, Logger } from '@nestjs/common';
import type {
  AiCallContext,
  AiCompletion,
  AiGeneration,
  AiStatus,
  AiStructuredRequest,
} from '../entities/ai-completion.js';
import { AiNotConfiguredError, AiOutputRejectedError } from '../errors/ai.errors.js';
import { AiProvider } from '../providers/ai-provider.js';
import { parseStructuredOutput } from '../rules/structured-output.js';
import { AiUsageService } from './ai-usage.service.js';

/**
 * The one door to the AI provider. Every call is metered (even when its answer is then
 * rejected, as the tokens were spent) and every answer is validated against its schema.
 * Prompts and answers are never logged.
 */
@Injectable()
export class AiGateway {
  private readonly logger = new Logger(AiGateway.name);

  constructor(
    private readonly provider: AiProvider,
    private readonly usage: AiUsageService,
  ) {}

  status(): AiStatus {
    return {
      configured: this.provider.isConfigured(),
      provider: this.provider.name,
      model: this.provider.model,
    };
  }

  /** Throws `AiNotConfiguredError` when no provider key is set, so callers can refuse early. */
  assertConfigured(): void {
    if (!this.provider.isConfigured()) {
      throw new AiNotConfiguredError();
    }
  }

  async generate<Output>(
    context: AiCallContext,
    request: AiStructuredRequest<Output>,
  ): Promise<AiGeneration<Output>> {
    this.assertConfigured();
    const completion = await this.provider.complete(request);
    await this.meter(context, completion);
    try {
      return { output: parseStructuredOutput(completion, request.schema), model: completion.model };
    } catch (error) {
      if (error instanceof AiOutputRejectedError) {
        this.logger.warn(`Rejected ${context.feature} output: ${error.reason}`);
      }
      throw error;
    }
  }

  private meter(context: AiCallContext, completion: AiCompletion): Promise<void> {
    return this.usage.record({
      workspaceId: context.workspaceId,
      feature: context.feature,
      provider: this.provider.name,
      model: completion.model,
      ...completion.usage,
    });
  }
}
