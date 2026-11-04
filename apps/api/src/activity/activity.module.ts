import { Module } from '@nestjs/common';
import { ActivityModule } from '@crossmart/core';
import { ActivityController } from './controllers/activity.controller.js';
import { ProductActivityController } from './controllers/product-activity.controller.js';

@Module({
  imports: [ActivityModule],
  controllers: [ActivityController, ProductActivityController],
})
export class ActivityApiModule {}
