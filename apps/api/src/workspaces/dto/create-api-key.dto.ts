import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { NewApiKey } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import { API_KEY_NAME_MAX_LENGTH, WORKSPACE_ROLE_SCHEMA_NAME } from '../workspaces.constants.js';

export class CreateApiKeyDto implements NewApiKey {
  @ApiProperty({ example: 'Claude Desktop', maxLength: API_KEY_NAME_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(API_KEY_NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({
    enum: WorkspaceRole,
    enumName: WORKSPACE_ROLE_SCHEMA_NAME,
    description: 'At most your own role. OWNER is not allowed.',
  })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;

  @ApiPropertyOptional({ description: 'Leave empty for a key that does not expire' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
