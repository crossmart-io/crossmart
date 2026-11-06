import { Module } from '@nestjs/common';
import { RedisModule } from '@crossmart/common';
import { AiModule } from '../ai/ai.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { AskAnswerCache } from './cache/ask-answer.cache.js';
import { AskDailyBudget } from './cache/ask-daily-budget.js';
import { RedisAskAnswerCache } from './cache/redis-ask-answer.cache.js';
import { RedisAskDailyBudget } from './cache/redis-ask-daily-budget.js';
import { AskSpendControls } from './services/ask-spend-controls.js';
import { AskService } from './services/ask.service.js';
import { KnowledgeBaseService } from './services/knowledge-base.service.js';
import { DocsKnowledgeSource } from './sources/docs-knowledge.source.js';
import { KNOWLEDGE_SOURCES } from './sources/knowledge-source.js';
import { PlanKnowledgeSource } from './sources/plan-knowledge.source.js';

/**
 * Ask Crossmart (ADR 0022): grounded answers about Crossmart from its public docs and plan
 * lineup, shared by the public `/ask` endpoint and the MCP `ask_crossmart` tool.
 */
@Module({
  imports: [AiModule, EntitlementsModule, RedisModule],
  providers: [
    DocsKnowledgeSource,
    PlanKnowledgeSource,
    {
      provide: KNOWLEDGE_SOURCES,
      useFactory: (docs: DocsKnowledgeSource, plans: PlanKnowledgeSource) => [docs, plans],
      inject: [DocsKnowledgeSource, PlanKnowledgeSource],
    },
    KnowledgeBaseService,
    { provide: AskAnswerCache, useClass: RedisAskAnswerCache },
    { provide: AskDailyBudget, useClass: RedisAskDailyBudget },
    AskSpendControls,
    AskService,
  ],
  exports: [AskService],
})
export class AskModule {}
