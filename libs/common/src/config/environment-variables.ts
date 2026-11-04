import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';
import { DEFAULT_MAIL_FROM } from '../mail/mail.constants.js';
import { MailDriver } from '../mail/mail-driver.enum.js';
import { StorageDriver } from '../storage/storage-driver.enum.js';
import { Environment } from './environment.enum.js';
import {
  DEFAULT_API_PORT,
  DEFAULT_MASTER_KEY_VERSION,
  DEFAULT_MEDIA_PUBLIC_URL,
  DEFAULT_WEB_APP_URL,
  DEFAULT_STORAGE_LOCAL_DIR,
  MAX_PORT,
  MIN_AUTH_SECRET_LENGTH,
  MIN_MASTER_KEY_VERSION,
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

  /** Where uploaded files (product images) are kept. */
  @IsEnum(StorageDriver)
  STORAGE_DRIVER: StorageDriver = StorageDriver.Local;

  /** Folder for the `local` storage driver, relative to the working directory. */
  @IsString()
  STORAGE_LOCAL_DIR: string = DEFAULT_STORAGE_LOCAL_DIR;

  /** Public base URL that uploaded files are served from. */
  @IsUrl({ require_tld: false })
  MEDIA_PUBLIC_URL: string = DEFAULT_MEDIA_PUBLIC_URL;

  /**
   * Public base URL of this API as channels reach it (OAuth callbacks, webhooks). Defaults to
   * `BETTER_AUTH_URL`; set it to a tunnel URL to test channel callbacks locally.
   */
  @IsOptional()
  @IsUrl({ require_tld: false })
  API_PUBLIC_URL?: string;

  /** Base URL of the web app, where channel connections send the merchant back to. */
  @IsUrl({ require_tld: false })
  WEB_APP_URL: string = DEFAULT_WEB_APP_URL;

  /**
   * Wraps the per-workspace keys that encrypt channel credentials. Generate with
   * `openssl rand -base64 32`. Without it, channels cannot be connected.
   */
  @IsOptional()
  @IsString()
  CREDENTIALS_MASTER_KEY?: string;

  /** Version of `CREDENTIALS_MASTER_KEY`. Increase it when rotating the key. */
  @IsInt()
  @Min(MIN_MASTER_KEY_VERSION)
  CREDENTIALS_MASTER_KEY_VERSION: number = DEFAULT_MASTER_KEY_VERSION;

  /** Previous master keys, still needed until data keys are rewrapped: `1:<key>,2:<key>`. */
  @IsOptional()
  @IsString()
  CREDENTIALS_RETIRED_MASTER_KEYS?: string;

  /** How email is sent: `log` (development) or `resend`. */
  @IsEnum(MailDriver)
  MAIL_DRIVER: MailDriver = MailDriver.Log;

  /** Resend API key with sending access. Required when `MAIL_DRIVER` is `resend`. */
  @ValidateIf((environment: EnvironmentVariables) => environment.MAIL_DRIVER === MailDriver.Resend)
  @IsString()
  @MinLength(1)
  RESEND_API_KEY?: string;

  /** The sender of every email, on a domain verified in Resend. */
  @IsString()
  MAIL_FROM: string = DEFAULT_MAIL_FROM;

  /** Client ID of the Crossmart Shopify app (Shopify Dev Dashboard). */
  @IsOptional()
  @IsString()
  SHOPIFY_CLIENT_ID?: string;

  /** Client secret of the Shopify app. Signs OAuth callbacks and webhooks. */
  @IsOptional()
  @IsString()
  SHOPIFY_CLIENT_SECRET?: string;
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
