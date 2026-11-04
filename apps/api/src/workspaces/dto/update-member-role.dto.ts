import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WorkspaceRole } from '@crossmart/database';
import { WORKSPACE_ROLE_SCHEMA_NAME } from '../workspaces.constants.js';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: WorkspaceRole,
    enumName: WORKSPACE_ROLE_SCHEMA_NAME,
    description: 'At most your own role. A workspace always keeps an owner.',
  })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
