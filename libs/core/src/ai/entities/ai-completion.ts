import type { z } from 'zod';
import type { AiFeature } from '../enums/ai-feature.enum.js';
import type { AiStopReason } from '../enums/ai-stop-reason.enum.js';

/**
 * One request for structured output. The schema is the contract: providers that can
 * constrain output to it do, and the answer is validated against it whatever the provider.
 */
export interface AiStructuredRequest<Output> {
  /** Instructions: who the model is and the rules it follows. Never holds secrets. */
  system: string;
  /** The task and its data. */
  prompt: string;
  schema: z.ZodType<Output>;
  maxOutputTokens: number;
}

export interface AiTokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/** What a provider returns: the raw answer, before it is validated. */
export interface AiCompletion {
  text: string;
  /** The model that answered, which may differ from the one asked (fallbacks). */
  model: string;
  stopReason: AiStopReason;
  usage: AiTokenUsage;
}

/** Who a call is for and what it does, for metering. */
export interface AiCallContext {
  workspaceId: string;
  feature: AiFeature;
}

/** A validated answer and the model that gave it. */
export interface AiGeneration<Output> {
  output: Output;
  model: string;
}

/** Whether AI features can run on this instance, for clients to show the right state. */
export interface AiStatus {
  configured: boolean;
  provider: string;
  model: string;
}
