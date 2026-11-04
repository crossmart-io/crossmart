import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { NewApiKey } from '@crossmart/core';
import { API_KEY_NAME_MAX_LENGTH } from '../workspaces.constants.js';
import { RoleAssignmentDto } from './role-assignment.dto.js';

/** OWNER is not allowed for keys. */
export class CreateApiKeyDto extends RoleAssignmentDto implements NewApiKey {
  @ApiProperty({ example: 'Claude Desktop', maxLength: API_KEY_NAME_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(API_KEY_NAME_MAX_LENGTH)
  name: string;

  @ApiPropertyOptional({ description: 'Leave empty for a key that does not expire' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
