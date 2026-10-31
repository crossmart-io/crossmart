import { Module } from '@nestjs/common';
import { AppConfigModule } from '@crossmart/common';
import { DatabaseModule } from '@crossmart/database';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [AppConfigModule, DatabaseModule, HealthModule],
})
export class ApiModule {}
