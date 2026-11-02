import { ApiProperty } from '@nestjs/swagger';
import type { WorkspaceAccess } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import { WORKSPACE_ROLE_SCHEMA_NAME } from '../workspaces.constants.js';

export class WorkspaceDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty()
  name: string;

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

  static from(access: WorkspaceAccess): WorkspaceDto {
    return Object.assign(new WorkspaceDto(), access);
  }
}
