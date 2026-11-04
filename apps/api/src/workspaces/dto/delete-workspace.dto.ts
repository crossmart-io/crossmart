import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { WORKSPACE_NAME_MAX_LENGTH } from '../workspaces.constants.js';

export class DeleteWorkspaceDto {
  @ApiProperty({
    description: 'The workspace’s name, typed to confirm: deleting it cannot be undone',
    maxLength: WORKSPACE_NAME_MAX_LENGTH,
  })
  @IsString()
  @MaxLength(WORKSPACE_NAME_MAX_LENGTH)
  confirmName: string;
}
