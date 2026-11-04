import { Module } from '@nestjs/common';
import { AppConfigModule, QueuesModule, StorageModule } from '@crossmart/common';
import { DatabaseModule } from '@crossmart/database';
import { ActivityApiModule } from './activity/activity.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogApiModule } from './catalog/catalog.module.js';
import { ChannelsApiModule } from './channels/channels.module.js';
import { HealthModule } from './health/health.module.js';
import { InventoryApiModule } from './inventory/inventory.module.js';
import { ListingsApiModule } from './listings/listings.module.js';
import { AnalyticsApiModule } from './analytics/analytics.module.js';
import { OrdersApiModule } from './orders/orders.module.js';
import { WorkspacesModule } from './workspaces/workspaces.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    QueuesModule,
    StorageModule,
    QueuesModule,
    AuthModule,
    HealthModule,
    WorkspacesModule,
    CatalogApiModule,
    ActivityApiModule,
    InventoryApiModule,
    ChannelsApiModule,
    ListingsApiModule,
    OrdersApiModule,
    AnalyticsApiModule,
  ],
})
export class ApiModule {}
