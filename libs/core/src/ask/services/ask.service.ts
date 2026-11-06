import { Injectable } from '@nestjs/common';
import { AppConfigService, type AskSettings } from '@crossmart/common';
import { AiFeature } from '../../ai/enums/ai-feature.enum.js';
import { askSystemPrompt, askUserPrompt } from '../../ai/prompts/ask.v2.prompt.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import { ASK_MAX_OUTPUT_TOKENS, ASK_RETRIEVED_CHUNKS } from '../ask.constants.js';
import type { AskAnswer } from '../entities/ask-answer.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { AskTurnedOffError } from '../errors/ask.errors.js';
import { askModelOutputSchema } from '../rules/ask-answer.schema.js';
import { groundedAnswer, unknownAnswer } from '../rules/grounded-answer.js';
import { AskSpendControls } from './ask-spend-controls.js';
import { KnowledgeBaseService } from './knowledge-base.service.js';

const TURNED_OFF_CAP = 0;

/**
 * Ask Crossmart: answers questions about Crossmart from its public docs and plan data, for
 * sellers (a support widget) and AI agents (the API and the MCP tool). It never reads
 * workspace data. Crossmart pays for the calls, so it spends the model only when retrieval
 * found something relevant, reuses recent answers, and stops at a daily cap.
 */
@Injectable()
export class AskService {
  constructor(
    private readonly ai: AiGateway,
    private readonly knowledge: KnowledgeBaseService,
    private readonly spend: AskSpendControls,
    private readonly config: AppConfigService,
  ) {}

  async ask(question: string, now = new Date()): Promise<AskAnswer> {
    const settings = this.config.askSettings;
    this.assertAvailable(settings);
    const cached = await this.spend.cachedAnswer(question);
    if (cached) return cached;
    const retrieved = await this.knowledge.search(question, ASK_RETRIEVED_CHUNKS, now.getTime());
    if (!retrieved.length) return unknownAnswer(settings.supportEmail);
    await this.spend.takeQuestion(settings.dailyQuestionCap, settings.supportEmail, now);
    const sources = retrieved.map((found) => found.chunk);
    const answer = await this.answerFrom(question, sources, settings);
    await this.spend.remember(question, answer);
    return answer;
  }

  private assertAvailable(settings: AskSettings): void {
    if (settings.dailyQuestionCap === TURNED_OFF_CAP) throw new AskTurnedOffError();
    this.ai.assertConfigured();
  }

  private async answerFrom(
    question: string,
    sources: readonly KnowledgeChunk[],
    settings: AskSettings,
  ): Promise<AskAnswer> {
    const { output } = await this.ai.generateForPlatform(
      { feature: AiFeature.Ask },
      {
        system: askSystemPrompt(settings.supportEmail),
        prompt: askUserPrompt(question, sources),
        schema: askModelOutputSchema,
        maxOutputTokens: ASK_MAX_OUTPUT_TOKENS,
        ...(settings.model ? { model: settings.model } : {}),
      },
    );
    return groundedAnswer(output, sources, settings.supportEmail);
  }
}
