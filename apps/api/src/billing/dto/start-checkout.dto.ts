import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { BillingInterval } from '@crossmart/database';
import { BILLING_INTERVAL_SCHEMA_NAME, PLAN_CODE_MAX_LENGTH } from '../billing.constants.js';

export class StartCheckoutDto {
  @ApiProperty({ example: 'growth', description: 'The `code` of an offered, self-serve plan' })
  @IsString()
  @MinLength(1)
  @MaxLength(PLAN_CODE_MAX_LENGTH)
  planCode: string;

  @ApiProperty({ enum: BillingInterval, enumName: BILLING_INTERVAL_SCHEMA_NAME })
  @IsEnum(BillingInterval)
  interval: BillingInterval;
}
