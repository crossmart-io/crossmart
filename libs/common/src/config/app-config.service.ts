import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CORS_ORIGINS_SEPARATOR } from './config.constants.js';
import { Environment } from './environment.enum.js';
import type { EnvironmentVariables } from './environment-variables.js';

/** Typed, read-only access to validated configuration. */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables, true>) {}

  get environment(): Environment {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isProduction(): boolean {
    return this.environment === Environment.Production;
  }

  get apiPort(): number {
    return this.configService.get('API_PORT', { infer: true });
  }

  get corsOrigins(): string[] {
    return this.configService
      .get('CORS_ORIGINS', { infer: true })
      .split(CORS_ORIGINS_SEPARATOR)
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get redisUrl(): string {
    return this.configService.get('REDIS_URL', { infer: true });
  }

  get authSecret(): string {
    return this.configService.get('BETTER_AUTH_SECRET', { infer: true });
  }

  get authBaseUrl(): string {
    return this.configService.get('BETTER_AUTH_URL', { infer: true });
  }
}
