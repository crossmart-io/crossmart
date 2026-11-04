import { Module } from '@nestjs/common';
import { AccountsModule, TenancyModule } from '@crossmart/core';
import { ApiKeysController } from './controllers/api-keys.controller.js';
import { CurrentApiKeyController } from './controllers/current-api-key.controller.js';
import { MeController } from './controllers/me.controller.js';
import { WorkspacesController } from './controllers/workspaces.controller.js';

@Module({
  imports: [AccountsModule, TenancyModule],
  controllers: [MeController, WorkspacesController, ApiKeysController, CurrentApiKeyController],
})
export class WorkspacesModule {}
