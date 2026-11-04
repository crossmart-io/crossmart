import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MaxLength,
} from 'class-validator';
import {
  DEFAULT_WORKSPACE_CURRENCY,
  type WorkspaceChanges,
  type WorkspaceInput,
} from '@crossmart/core';
import { WORKSPACE_NAME_MAX_LENGTH } from '../workspaces.constants.js';

const TIME_ZONE_DESCRIPTION =
  'IANA time zone where the workspace’s day starts, for reports, such as Asia/Jerusalem';

export class CreateWorkspaceDto implements WorkspaceInput {
  @ApiProperty({ example: 'EU store', maxLength: WORKSPACE_NAME_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(WORKSPACE_NAME_MAX_LENGTH)
  name: string;

  @ApiPropertyOptional({
    example: 'EUR',
    default: DEFAULT_WORKSPACE_CURRENCY,
    description: 'ISO 4217 code of the catalog prices. It cannot change later.',
  })
  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;

  @ApiPropertyOptional({ example: 'Europe/Berlin', description: TIME_ZONE_DESCRIPTION })
  @IsOptional()
  @IsTimeZone()
  timeZone?: string;
}

/** Send only what changes. The currency cannot change. */
export class UpdateWorkspaceDto implements WorkspaceChanges {
  @ApiPropertyOptional({ example: 'EU store', maxLength: WORKSPACE_NAME_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(WORKSPACE_NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({ example: 'Asia/Jerusalem', description: TIME_ZONE_DESCRIPTION })
  @IsOptional()
  @IsTimeZone()
  timeZone?: string;
}
