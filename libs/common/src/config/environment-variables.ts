import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsString, IsUrl, Max, Min, MinLength, validateSync } from 'class-validator';
import { Environment } from './environment.enum.js';
import {
  DEFAULT_API_PORT,
  MAX_PORT,
  MIN_AUTH_SECRET_LENGTH,
  MIN_PORT,
} from './config.constants.js';

/**
 * Every environment variable the platform reads, validated once at boot.
 * Add new variables here; never read `process.env` directly elsewhere.
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(MIN_PORT)
  @Max(MAX_PORT)
  API_PORT: number = DEFAULT_API_PORT;

  @IsString()
  CORS_ORIGINS = '';

  @IsUrl({ protocols: ['postgres', 'postgresql'], require_tld: false })
  DATABASE_URL: string;

  @IsUrl({ protocols: ['redis', 'rediss'], require_tld: false })
  REDIS_URL: string;

  /** Signs sessions and cookies. Generate with `openssl rand -base64 32`. */
  @IsString()
  @MinLength(MIN_AUTH_SECRET_LENGTH)
  BETTER_AUTH_SECRET: string;

  /** Public base URL of this API, used for auth callbacks and cookies. */
  @IsUrl({ require_tld: false })
  BETTER_AUTH_URL: string;
}

export function validateEnvironment(rawConfig: Record<string, unknown>): EnvironmentVariables {
  const environment = plainToInstance(EnvironmentVariables, rawConfig, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(environment, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.toString()}`);
  }
  return environment;
}
