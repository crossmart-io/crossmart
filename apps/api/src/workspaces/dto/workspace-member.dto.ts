import { ApiProperty } from '@nestjs/swagger';
import type { WorkspaceMemberProfile } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
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

  @ApiProperty()
  joinedAt: Date;

  static from(member: WorkspaceMemberProfile): WorkspaceMemberDto {
    return Object.assign(new WorkspaceMemberDto(), member);
  }
}
