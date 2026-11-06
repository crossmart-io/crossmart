import { Injectable, Logger } from '@nestjs/common';
import { AI_CREDITS_PER_CALL } from '../../entitlements/entitlements.constants.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import { EntitlementService } from '../../entitlements/services/entitlement.service.js';
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

const ONE_CALL = 1;

/**
 * The one door to the AI provider. Every call first needs AI credits left on the plan, is
 * metered (even when its answer is then rejected, as the tokens were spent) and has its answer
 * validated against its schema. Prompts and answers are never logged.
 */
@Injectable()
export class AiGateway {
  private readonly logger = new Logger(AiGateway.name);

  constructor(
    private readonly provider: AiProvider,
    private readonly usage: AiUsageService,
    private readonly entitlements: EntitlementService,
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

  /**
   * Throws `EntitlementExceededException` (HTTP 402, `plan_limit_reached`) when plans are
   * enforced and the organization's AI credits this month do not cover `calls` more calls.
   */
  assertCredits(workspaceId: string, calls = ONE_CALL): Promise<void> {
    return this.entitlements.assertInWorkspace(
      workspaceId,
      Feature.AiCredits,
      calls * AI_CREDITS_PER_CALL,
    );
  }

  async generate<Output>(
    context: AiCallContext,
    request: AiStructuredRequest<Output>,
  ): Promise<AiGeneration<Output>> {
    this.assertConfigured();
    await this.assertCredits(context.workspaceId);
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
