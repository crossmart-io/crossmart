import { performance } from 'node:perf_hooks';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import type { AskReply } from '../entities/ask-reply.js';
import type { AskRequest } from '../entities/ask-request.js';
import { AskCallerType } from '../enums/ask-caller-type.enum.js';
import { AskTurnedOffError } from '../errors/ask.errors.js';
import { escalationOffer } from '../rules/escalation-offer.js';
import { AskAnswerer } from './ask-answerer.js';
import { AskConversationsService, type OpenedConversation } from './ask-conversations.service.js';

const TURNED_OFF_CAP = 0;

/**
 * Ask Crossmart: answers questions about Crossmart from its public docs and plan data, for
 * sellers (the widgets) and AI agents (the API, MCP and A2A), within a conversation (ADR 0022,
 * ADR 0025). Callers signed in to a workspace may also ask about it, read-only. Every question
 * and answer is stored, redacted, so the team knows what people ask; when Ask cannot help, the
 * reply offers a person.
 */
@Injectable()
export class AskService {
  constructor(
    private readonly ai: AiGateway,
    private readonly answerer: AskAnswerer,
    private readonly conversations: AskConversationsService,
    private readonly config: AppConfigService,
  ) {}

  async ask(request: AskRequest, now = new Date()): Promise<AskReply> {
    const startedAt = performance.now();
    this.assertAvailable();
    const opened = await this.conversations.open(request, now);
    const composed = await this.answerer.answer({
      question: request.question,
      history: opened.history,
      workspace: request.caller.workspace,
      cacheable: this.isCacheable(request, opened),
      now,
    });
    const offer = escalationOffer(composed);
    const latencyMs = Math.round(performance.now() - startedAt);
    const recorded = await this.conversations.record(
      request,
      opened,
      { composed, offer, latencyMs },
      now,
    );
    return { ...composed.answer, ...recorded, escalation: offer };
  }

  private assertAvailable(): void {
    if (this.config.askSettings.dailyQuestionCap === TURNED_OFF_CAP) throw new AskTurnedOffError();
    this.ai.assertConfigured();
  }

  /**
   * Only a first question from an anonymous caller is answered from (and kept in) the cache:
   * a follow-up depends on the conversation, and an identified caller's on their account.
   */
  private isCacheable(request: AskRequest, opened: OpenedConversation): boolean {
    return (
      !opened.existing &&
      request.caller.type === AskCallerType.Anonymous &&
      request.caller.workspace === null
    );
  }
}
