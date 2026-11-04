import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, MaxLength } from 'class-validator';
import type { NewInvitation } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import { EMAIL_MAX_LENGTH, WORKSPACE_ROLE_SCHEMA_NAME } from '../workspaces.constants.js';

export class InviteMemberDto implements NewInvitation {
  @ApiProperty({ example: 'dana@example.com', maxLength: EMAIL_MAX_LENGTH })
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @ApiProperty({
    enum: WorkspaceRole,
    enumName: WORKSPACE_ROLE_SCHEMA_NAME,
    description: 'At most your own role.',
  })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
