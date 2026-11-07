import { Module } from '@nestjs/common';
import { RedisModule } from '@crossmart/common';
import { AiModule } from '../ai/ai.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { ChannelsModule } from '../channels/channels.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { WebhookTransportModule } from '../webhooks/webhook-transport.module.js';
import { AskStorageModule } from './ask-storage.module.js';
import { AskAnswerCache } from './cache/ask-answer.cache.js';
import { AskDailyBudget } from './cache/ask-daily-budget.js';
import { AskQuota } from './cache/ask-quota.js';
import { RedisAskAnswerCache } from './cache/redis-ask-answer.cache.js';
import { RedisAskDailyBudget } from './cache/redis-ask-daily-budget.js';
import { RedisAskQuota } from './cache/redis-ask-quota.js';
import { AskEscalationRepository } from './repositories/ask-escalation.repository.js';
import { AskInsightsRepository } from './repositories/ask-insights.repository.js';
import { ACCOUNT_LOOKUPS, type AccountLookup } from './lookups/account-lookup.js';
import { AccountFactPages } from './lookups/account-fact-pages.js';
import { ChannelConnectionsLookup } from './lookups/channel-connections.lookup.js';
import { FailedListingsLookup } from './lookups/failed-listings.lookup.js';
import { ListingStatusLookup } from './lookups/listing-status.lookup.js';
import { PlanUsageLookup } from './lookups/plan-usage.lookup.js';
import { AccountLookupsService } from './services/account-lookups.service.js';
import { AskAnswerer } from './services/ask-answerer.js';
import { AskCallerKeys } from './services/ask-caller-keys.js';
import { AskConversationsService } from './services/ask-conversations.service.js';
import { AskEscalationCallback } from './services/ask-escalation.callback.js';
import { AskEscalationIntake } from './services/ask-escalation.intake.js';
import { AskEscalationNotifier } from './services/ask-escalation.notifier.js';
import { AskEscalationsService } from './services/ask-escalations.service.js';
import { AskInsightsService } from './services/ask-insights.service.js';
import { AskModel } from './services/ask-model.js';
import { AskSpendControls } from './services/ask-spend-controls.js';
import { AskService } from './services/ask.service.js';
import { KnowledgeBaseService } from './services/knowledge-base.service.js';
import { DocsKnowledgeSource } from './sources/docs-knowledge.source.js';
import { KNOWLEDGE_SOURCES } from './sources/knowledge-source.js';
import { PlanKnowledgeSource } from './sources/plan-knowledge.source.js';

/**
 * Ask Crossmart (ADR 0022, ADR 0025): grounded answers about Crossmart from its public docs and
 * plan lineup, in conversations, with read-only account lookups for signed-in callers and
 * escalation to a person. Shared by the `/ask` endpoints, the MCP tool and the A2A endpoint.
 */
@Module({
  imports: [
    AiModule,
    AskStorageModule,
    CatalogModule,
    ChannelsModule,
    EntitlementsModule,
    ListingsModule,
    NotificationsModule,
    RedisModule,
    WebhookTransportModule,
  ],
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
    { provide: AskQuota, useClass: RedisAskQuota },
    AskSpendControls,
    AskModel,
    AskCallerKeys,
    AskEscalationRepository,
    AskInsightsRepository,
    AccountFactPages,
    ListingStatusLookup,
    PlanUsageLookup,
    ChannelConnectionsLookup,
    FailedListingsLookup,
    {
      provide: ACCOUNT_LOOKUPS,
      useFactory: (...lookups: AccountLookup[]) => lookups,
      inject: [
        ListingStatusLookup,
        PlanUsageLookup,
        ChannelConnectionsLookup,
        FailedListingsLookup,
      ],
    },
    AccountLookupsService,
    AskAnswerer,
    AskConversationsService,
    AskEscalationCallback,
    AskEscalationNotifier,
    AskEscalationIntake,
    AskEscalationsService,
    AskInsightsService,
    AskService,
  ],
  exports: [
    AskService,
    AskConversationsService,
    AskEscalationsService,
    AskInsightsService,
    AskCallerKeys,
  ],
})
export class AskModule {}
