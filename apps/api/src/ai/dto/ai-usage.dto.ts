import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import {
  AiFeature,
  type AiUsageLine,
  type AiUsageReport,
  type AiUsageTotals,
} from '@crossmart/core';
import { AI_FEATURE_SCHEMA_NAME } from '../ai.constants.js';

/** A usage period; both ends or neither (the current UTC month). */
export class AiUsageQueryDto {
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Start, included' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'End, excluded' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

export class AiUsageTotalsDto implements AiUsageTotals {
  @ApiProperty()
  calls: number;

  @ApiProperty()
  inputTokens: number;

  @ApiProperty()
  outputTokens: number;
}

export class AiUsageLineDto extends AiUsageTotalsDto implements AiUsageLine {
  @ApiProperty({ enum: AiFeature, enumName: AI_FEATURE_SCHEMA_NAME })
  feature: AiFeature;

  @ApiProperty({ example: 'claude-sonnet-5-5' })
  model: string;
}

/** The workspace's AI calls and tokens in a period, per feature and model. */
export class AiUsageReportDto implements AiUsageReport {
  @ApiProperty()
  from: Date;

  @ApiProperty()
  to: Date;

  @ApiProperty({ type: AiUsageTotalsDto })
  totals: AiUsageTotalsDto;

  @ApiProperty({ type: [AiUsageLineDto] })
  lines: AiUsageLineDto[];

  static from(report: AiUsageReport): AiUsageReportDto {
    return Object.assign(new AiUsageReportDto(), {
      ...report,
      totals: Object.assign(new AiUsageTotalsDto(), report.totals),
      lines: report.lines.map((line) => Object.assign(new AiUsageLineDto(), line)),
    });
  }
}
