import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ATTENTION_DEFAULT_LIMIT, ATTENTION_MAX_LIMIT } from '@crossmart/core';

export class AttentionQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: ATTENTION_MAX_LIMIT,
    default: ATTENTION_DEFAULT_LIMIT,
    description: 'Items each section lists, latest first. The counts always cover everything.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ATTENTION_MAX_LIMIT)
  limit: number = ATTENTION_DEFAULT_LIMIT;
}
