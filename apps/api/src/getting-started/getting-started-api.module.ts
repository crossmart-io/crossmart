import { Module } from '@nestjs/common';
import { GettingStartedModule } from '@crossmart/core';
import { GettingStartedController } from './controllers/getting-started.controller.js';

@Module({
  imports: [GettingStartedModule],
  controllers: [GettingStartedController],
})
export class GettingStartedApiModule {}
