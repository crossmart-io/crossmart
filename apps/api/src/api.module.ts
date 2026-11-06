import { Module } from '@nestjs/common';
import { AppConfigModule, MailModule, QueuesModule, StorageModule } from '@crossmart/common';
import { DatabaseModule } from '@crossmart/database';
import { ActivityApiModule } from './activity/activity.module.js';
import { AgentsApiModule } from './agents/agents-api.module.js';
import { AiApiModule } from './ai/ai.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogApiModule } from './catalog/catalog.module.js';
import { EntitlementsApiModule } from './entitlements/entitlements.module.js';
import { ChannelsApiModule } from './channels/channels.module.js';
import { HealthModule } from './health/health.module.js';
import { InventoryApiModule } from './inventory/inventory.module.js';
import { ListingsApiModule } from './listings/listings.module.js';
import { MediaMaintenanceModule } from './media/media-maintenance.module.js';
import { AnalyticsApiModule } from './analytics/analytics.module.js';
import { OrdersApiModule } from './orders/orders.module.js';
import { SuggestionsApiModule } from './suggestions/suggestions.module.js';
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
    CatalogApiModule,
    MediaMaintenanceModule,
    ActivityApiModule,
    InventoryApiModule,
    ChannelsApiModule,
    ListingsApiModule,
    OrdersApiModule,
    AnalyticsApiModule,
    SuggestionsApiModule,
    AiApiModule,
    AgentsApiModule,
  ],
})
export class ApiModule {}
