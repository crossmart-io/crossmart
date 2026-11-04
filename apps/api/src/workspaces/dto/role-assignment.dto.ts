import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import type { CustomRoleRef, RoleAssignment } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import { WORKSPACE_ROLE_SCHEMA_NAME } from '../workspaces.constants.js';

/** A role to grant: a built-in role, or CUSTOM with the workspace's own role. */
export class RoleAssignmentDto implements RoleAssignment {
  @ApiProperty({
    enum: WorkspaceRole,
    enumName: WORKSPACE_ROLE_SCHEMA_NAME,
    description: 'At most your own access. CUSTOM needs `customRoleId`.',
  })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;

  @ApiPropertyOptional({ format: 'uuid', description: 'One of the workspace’s roles, with CUSTOM' })
  @IsOptional()
  @IsUUID()
  customRoleId?: string;
}

export class CustomRoleRefDto implements CustomRoleRef {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

/** The `customRole` property of anything that holds a role. */
export const CUSTOM_ROLE_PROPERTY = {
  type: CustomRoleRefDto,
  nullable: true,
  description: 'The workspace’s own role, when `role` is CUSTOM',
} as const;
