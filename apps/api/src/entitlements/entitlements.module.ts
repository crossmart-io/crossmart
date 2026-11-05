import { Module } from '@nestjs/common';
import { EntitlementsModule, TenancyModule } from '@crossmart/core';
import { OrganizationSubscriptionController } from './controllers/organization-subscription.controller.js';

@Module({
  imports: [EntitlementsModule, TenancyModule],
  controllers: [OrganizationSubscriptionController],
})
export class EntitlementsApiModule {}
