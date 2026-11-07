import { Injectable } from '@nestjs/common';
import { AppConfigService, type AskSettings } from '@crossmart/common';
import type { z } from 'zod';
import { AiFeature } from '../../ai/enums/ai-feature.enum.js';
import {
  type AskAccountMode,
  askSystemPrompt,
  askUserPrompt,
} from '../../ai/prompts/ask.v3.prompt.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import { ASK_MAX_OUTPUT_TOKENS } from '../ask.constants.js';
import type { AskContextTurn } from '../entities/ask-context.js';
import type { PromptSource } from '../entities/prompt-source.js';
import type { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { AskSpendControls } from './ask-spend-controls.js';

/** One model call: what it is told, and what it must answer with. */
export interface AskModelCall<Output> {
  question: string;
  sources: readonly PromptSource[];
  history: readonly AskContextTurn[];
  mode: AskAccountMode;
  lookups: readonly AccountLookupKind[];
  schema: z.ZodType<Output>;
}

/** A validated answer and the model that gave it. */
export interface AskModelAnswer<Output> {
  output: Output;
  model: string;
}

/**
 * Ask's calls to the model, paid by the platform: each one takes a question from today's
 * budget first, and uses the Ask model (`ASK_AI_MODEL`) when one is set.
 */
@Injectable()
export class AskModel {
  constructor(
    private readonly ai: AiGateway,
    private readonly spend: AskSpendControls,
    private readonly config: AppConfigService,
  ) {}

  get settings(): AskSettings {
    return this.config.askSettings;
  }

  async generate<Output>(call: AskModelCall<Output>, now: Date): Promise<AskModelAnswer<Output>> {
    const settings = this.settings;
    await this.spend.takeQuestion(settings.dailyQuestionCap, settings.supportEmail, now);
    return this.ai.generateForPlatform(
      { feature: AiFeature.Ask },
      {
        system: askSystemPrompt(settings.supportEmail, call.mode, call.lookups),
        prompt: askUserPrompt(call.question, call.sources, call.history),
        schema: call.schema,
        maxOutputTokens: ASK_MAX_OUTPUT_TOKENS,
        ...(settings.model ? { model: settings.model } : {}),
      },
    );
  }
}
