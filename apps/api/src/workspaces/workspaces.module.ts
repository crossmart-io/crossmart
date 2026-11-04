import { Module } from '@nestjs/common';
import { TenancyModule } from '@crossmart/core';
import { ApiKeysController } from './controllers/api-keys.controller.js';
import { MeController } from './controllers/me.controller.js';
import { WorkspacesController } from './controllers/workspaces.controller.js';

@Module({
  imports: [TenancyModule],
  controllers: [MeController, WorkspacesController, ApiKeysController],
})
export class WorkspacesModule {}
