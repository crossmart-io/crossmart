import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import type { NewInvitation } from '@crossmart/core';
import { EMAIL_MAX_LENGTH } from '../workspaces.constants.js';
import { RoleAssignmentDto } from './role-assignment.dto.js';

export class InviteMemberDto extends RoleAssignmentDto implements NewInvitation {
  @ApiProperty({ example: 'dana@example.com', maxLength: EMAIL_MAX_LENGTH })
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;
}
