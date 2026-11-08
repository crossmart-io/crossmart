import { HttpException } from '@nestjs/common';
import {
  AiKeyRejectedError,
  AiNotConfiguredError,
  AiProviderUnavailableError,
} from '../../ai/errors/ai.errors.js';
import { EntitlementExceededException } from '../../entitlements/errors/entitlement-exceeded.exception.js';
import { SandboxRestrictedException } from '../../entitlements/errors/sandbox-restricted.exception.js';
import { AGENT_WORKER_TURN_FAILED } from '../agent-worker.constants.js';
import type { AgentWorkerErrorView } from '../entities/agent-worker-stream.js';
import { AgentWorkerErrorCode } from '../enums/agent-worker-error-code.enum.js';

export const AGENT_WORKER_CREDITS_EXHAUSTED =
  'Your plan’s AI credits for this month are used up, so Crossmart Agent cannot answer. An owner ' +
  'or admin can upgrade the plan under Settings, Billing; credits renew on the 1st (UTC).';

/** The message an HTTP refusal carries, whether its body is text or an object. */
export function messageOf(error: HttpException): string {
  const response = error.getResponse();
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  return typeof message === 'string' ? message : error.message;
}

/** Why a turn stopped, as the person reads it, without internals. */
export function describeTurnError(error: unknown): AgentWorkerErrorView {
  if (error instanceof EntitlementExceededException) {
    return { code: AgentWorkerErrorCode.CreditsExhausted, message: AGENT_WORKER_CREDITS_EXHAUSTED };
  }
  if (error instanceof SandboxRestrictedException) {
    return { code: AgentWorkerErrorCode.SandboxClaimRequired, message: messageOf(error) };
  }
  if (
    error instanceof AiNotConfiguredError ||
    error instanceof AiKeyRejectedError ||
    error instanceof AiProviderUnavailableError
  ) {
    return { code: AgentWorkerErrorCode.AiUnavailable, message: messageOf(error) };
  }
  return { code: AgentWorkerErrorCode.Internal, message: AGENT_WORKER_TURN_FAILED };
}
