import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import type { SuggestionRef } from '@crossmart/core';

/** The route parameters that name one suggestion in a workspace. */
export class SuggestionParamsDto implements SuggestionRef {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  suggestionId: string;
}
