import { Module } from '@nestjs/common';
import { WorkspaceSettingsRepository } from './workspace-settings.repository.js';

/** Read access to a workspace's currency and time zone, for features that depend on them. */
@Module({
  providers: [WorkspaceSettingsRepository],
  exports: [WorkspaceSettingsRepository],
})
export class WorkspaceSettingsModule {}
