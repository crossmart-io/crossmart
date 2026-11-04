import { SetMetadata } from '@nestjs/common';
import type { WorkspacePermission } from '@crossmart/core';
import { REQUIRED_PERMISSION_METADATA_KEY } from '../auth.constants.js';

/** Requires the caller to hold `permission` in the workspace named by the `:workspaceId` param. */
export const RequirePermission = (
  permission: WorkspacePermission,
): MethodDecorator & ClassDecorator => SetMetadata(REQUIRED_PERMISSION_METADATA_KEY, permission);
