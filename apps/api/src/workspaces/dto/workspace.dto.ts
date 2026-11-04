import { ApiProperty } from '@nestjs/swagger';
import { permissionsOf, type WorkspaceAccess, WorkspacePermission } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import {
  WORKSPACE_PERMISSION_SCHEMA_NAME,
  WORKSPACE_ROLE_SCHEMA_NAME,
} from '../workspaces.constants.js';

export class WorkspaceDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'The name to show: the organization name while the workspace is named Default',
  })
  displayName: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 code of the catalog prices' })
  currency: string;

  @ApiProperty({
    enum: WorkspaceRole,
    enumName: WORKSPACE_ROLE_SCHEMA_NAME,
    description: 'Your role here',
  })
  role: WorkspaceRole;

  @ApiProperty({
    enum: WorkspacePermission,
    enumName: WORKSPACE_PERMISSION_SCHEMA_NAME,
    isArray: true,
    description: 'What your role lets you do here. Check these, not the role, to adapt a UI.',
  })
  permissions: WorkspacePermission[];

  static from(access: WorkspaceAccess): WorkspaceDto {
    return Object.assign(new WorkspaceDto(), access, { permissions: permissionsOf(access.role) });
  }
}
