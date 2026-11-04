import { ApiProperty } from '@nestjs/swagger';
import { toPermissionList, WorkspacePermission } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import type { ApiKeyPrincipal } from '../../auth/entities/principal.js';
import {
  WORKSPACE_PERMISSION_SCHEMA_NAME,
  WORKSPACE_ROLE_SCHEMA_NAME,
} from '../workspaces.constants.js';
import { CUSTOM_ROLE_PROPERTY, CustomRoleRefDto } from './role-assignment.dto.js';

export class CurrentApiKeyDto {
  @ApiProperty({ format: 'uuid' })
  apiKeyId: string;

  @ApiProperty({ format: 'uuid', description: 'The one workspace the key works in' })
  workspaceId: string;

  @ApiProperty({ enum: WorkspaceRole, enumName: WORKSPACE_ROLE_SCHEMA_NAME })
  role: WorkspaceRole;

  @ApiProperty(CUSTOM_ROLE_PROPERTY)
  customRole: CustomRoleRefDto | null;

  @ApiProperty({
    enum: WorkspacePermission,
    enumName: WORKSPACE_PERMISSION_SCHEMA_NAME,
    isArray: true,
    description: 'What the key may do',
  })
  permissions: WorkspacePermission[];

  static from(principal: ApiKeyPrincipal): CurrentApiKeyDto {
    return Object.assign(new CurrentApiKeyDto(), {
      apiKeyId: principal.apiKeyId,
      workspaceId: principal.workspaceId,
      role: principal.role,
      customRole: principal.customRole,
      permissions: toPermissionList(principal.permissions),
    });
  }
}
