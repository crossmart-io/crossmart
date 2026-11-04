import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsTimeZone } from 'class-validator';
import { DEFAULT_SALES_RANGE, SalesRange, type SalesReportQuery } from '@crossmart/core';
import { SALES_RANGE_SCHEMA_NAME } from '../analytics.constants.js';

export class SalesReportQueryDto implements SalesReportQuery {
  @ApiPropertyOptional({
    enum: SalesRange,
    enumName: SALES_RANGE_SCHEMA_NAME,
    default: DEFAULT_SALES_RANGE,
  })
  @IsOptional()
  @IsEnum(SalesRange)
  range: SalesRange = DEFAULT_SALES_RANGE;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description:
      "IANA time zone that days, weeks and months follow. Defaults to the workspace's time " +
      'zone, else UTC.',
  })
  @IsOptional()
  @IsTimeZone()
  timeZone?: string;
}
