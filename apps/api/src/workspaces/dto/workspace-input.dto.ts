import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DEFAULT_WORKSPACE_CURRENCY, type WorkspaceInput } from '@crossmart/core';
import { WORKSPACE_NAME_MAX_LENGTH } from '../workspaces.constants.js';

export class RenameWorkspaceDto {
  @ApiProperty({ example: 'EU store', maxLength: WORKSPACE_NAME_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(WORKSPACE_NAME_MAX_LENGTH)
  name: string;
}

export class CreateWorkspaceDto extends RenameWorkspaceDto implements WorkspaceInput {
  @ApiPropertyOptional({
    example: 'EUR',
    default: DEFAULT_WORKSPACE_CURRENCY,
    description: 'ISO 4217 code of the catalog prices. It cannot change later.',
  })
  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;
}
