import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@crossmart/database';
import { DATABASE_HEALTH_KEY, HEALTH_ROUTE, HEALTH_TAG } from './health.constants.js';

@ApiTags(HEALTH_TAG)
@Controller(HEALTH_ROUTE)
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Report API and database health' })
  check(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.prismaHealthIndicator.pingCheck(DATABASE_HEALTH_KEY, this.prismaService),
    ]);
  }
}
