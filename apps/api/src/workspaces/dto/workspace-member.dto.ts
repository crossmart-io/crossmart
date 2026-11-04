import { ApiProperty } from '@nestjs/swagger';
import type { WorkspaceMemberProfile } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import { CUSTOM_ROLE_PROPERTY, CustomRoleRefDto } from './role-assignment.dto.js';
import { WORKSPACE_ROLE_SCHEMA_NAME } from '../workspaces.constants.js';

export class WorkspaceMemberDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: WorkspaceRole, enumName: WORKSPACE_ROLE_SCHEMA_NAME })
  role: WorkspaceRole;

  @ApiProperty(CUSTOM_ROLE_PROPERTY)
  customRole: CustomRoleRefDto | null;

  @ApiProperty()
  joinedAt: Date;

  static from(member: WorkspaceMemberProfile): WorkspaceMemberDto {
    const { userId, name, email, role, customRole, joinedAt } = member;
    return Object.assign(new WorkspaceMemberDto(), {
      userId,
      name,
      email,
      role,
      customRole,
      joinedAt,
    });
  }
}
