import { Module } from '@nestjs/common';
import { AppConfigModule } from '@crossmart/common';
import { DatabaseModule } from '@crossmart/database';
import { AuthModule } from './auth/auth.module.js';
import { CatalogApiModule } from './catalog/catalog.module.js';
import { HealthModule } from './health/health.module.js';
import { WorkspacesModule } from './workspaces/workspaces.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
    WorkspacesModule,
    CatalogApiModule,
  ],
})
export class ApiModule {}
