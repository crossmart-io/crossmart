import { Module } from '@nestjs/common';
import { AppConfigModule, MailModule, QueuesModule, StorageModule } from '@crossmart/common';
import { DatabaseModule } from '@crossmart/database';
import { A2aApiModule } from './a2a/a2a.module.js';
import { ActivityApiModule } from './activity/activity.module.js';
import { AgentsApiModule } from './agents/agents-api.module.js';
import { AgentProposalsApiModule } from './agent-proposals/agent-proposals-api.module.js';
import { AgentWorkerApiModule } from './agent-worker/agent-worker-api.module.js';
import { AiApiModule } from './ai/ai.module.js';
import { AskApiModule } from './ask/ask.module.js';
import { AttentionApiModule } from './attention/attention-api.module.js';
import { GettingStartedApiModule } from './getting-started/getting-started-api.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BillingApiModule } from './billing/billing-api.module.js';
import { CatalogApiModule } from './catalog/catalog.module.js';
import { EntitlementsApiModule } from './entitlements/entitlements.module.js';
import { ChannelsApiModule } from './channels/channels.module.js';
import { HealthModule } from './health/health.module.js';
import { InventoryApiModule } from './inventory/inventory.module.js';
import { ListingsApiModule } from './listings/listings.module.js';
import { MediaMaintenanceModule } from './media/media-maintenance.module.js';
import { AnalyticsApiModule } from './analytics/analytics.module.js';
import { OrdersApiModule } from './orders/orders.module.js';
import { SandboxApiModule } from './sandbox/sandbox-api.module.js';
import { SuggestionsApiModule } from './suggestions/suggestions.module.js';
import { WebhooksApiModule } from './webhooks/webhooks.module.js';
import { WorkspaceEventsApiModule } from './workspace-events/workspace-events-api.module.js';
import { WorkspacesModule } from './workspaces/workspaces.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    QueuesModule,
    StorageModule,
    MailModule,
    QueuesModule,
    AuthModule,
    HealthModule,
    WorkspacesModule,
    EntitlementsApiModule,
    BillingApiModule,
    CatalogApiModule,
    MediaMaintenanceModule,
    ActivityApiModule,
    InventoryApiModule,
    ChannelsApiModule,
    ListingsApiModule,
    OrdersApiModule,
    AnalyticsApiModule,
    AttentionApiModule,
    GettingStartedApiModule,
    SuggestionsApiModule,
    AiApiModule,
    AgentWorkerApiModule,
    AgentProposalsApiModule,
    AgentsApiModule,
    AskApiModule,
    A2aApiModule,
    SandboxApiModule,
    WebhooksApiModule,
    WorkspaceEventsApiModule,
  ],
})
export class ApiModule {}
