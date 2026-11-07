import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';
import { DEFAULT_MAIL_FROM } from '../mail/mail.constants.js';
import { MailDriver } from '../mail/mail-driver.enum.js';
import { StorageDriver } from '../storage/storage-driver.enum.js';
import { BillingDriver } from './billing-driver.enum.js';
import { EbayEnvironment } from './ebay-environment.enum.js';
import { Environment } from './environment.enum.js';
import {
  DEFAULT_API_PORT,
  DEFAULT_ASK_DAILY_QUESTION_CAP,
  DEFAULT_ASK_ESCALATION_EMAIL,
  DEFAULT_ASK_SUPPORT_EMAIL,
  DEFAULT_BILLING_PAST_DUE_GRACE_DAYS,
  DEFAULT_BILLING_SALES_EMAIL,
  DEFAULT_BILLING_TRIAL_DAYS,
  DEFAULT_STRIPE_AUTOMATIC_TAX,
  DEFAULT_ENTITLEMENTS_ENFORCED,
  DEFAULT_WEBHOOK_ALLOW_PRIVATE_URLS,
  DEFAULT_MASTER_KEY_VERSION,
  DEFAULT_MEDIA_PUBLIC_URL,
  DEFAULT_WEB_APP_URL,
  DEFAULT_MCP_PUBLIC_URL,
  DEFAULT_STORAGE_LOCAL_DIR,
  EBAY_VERIFICATION_TOKEN_PATTERN,
  ENV_TRUE,
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
   * The remote MCP server's public address, including its `/mcp` path. Agent access tokens are
   * issued for it (their audience), and the API accepts no others (ADR 0019).
   */
  @IsUrl({ require_tld: false, require_protocol: true })
  MCP_PUBLIC_URL: string = DEFAULT_MCP_PUBLIC_URL;

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

  /** App ID (client ID) of the Crossmart eBay app (eBay Developers Program keyset). */
  @IsOptional()
  @IsString()
  EBAY_CLIENT_ID?: string;

  /** Cert ID (client secret) of the eBay keyset. Authenticates token requests; never logged. */
  @IsOptional()
  @IsString()
  EBAY_CLIENT_SECRET?: string;

  /** The RuName eBay issued for the callback URL. eBay takes it in place of a redirect URL. */
  @IsOptional()
  @IsString()
  EBAY_RU_NAME?: string;

  /** The eBay the keyset belongs to: `sandbox` or `production`. */
  @IsEnum(EbayEnvironment)
  EBAY_ENVIRONMENT: EbayEnvironment = EbayEnvironment.Sandbox;

  /**
   * The verification token entered with the marketplace account deletion endpoint in the eBay
   * developer portal: 32 to 80 letters, digits, `_` or `-`. Answers eBay's endpoint challenge.
   */
  @ValidateIf((environment: EnvironmentVariables) => Boolean(environment.EBAY_VERIFICATION_TOKEN))
  @Matches(EBAY_VERIFICATION_TOKEN_PATTERN)
  EBAY_VERIFICATION_TOKEN?: string;

  /** OAuth client ID of the Crossmart Google Cloud app, for Google Merchant Center. */
  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  /** OAuth client secret of the Google Cloud app. */
  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  /** The keystring of the Crossmart Etsy app: its OAuth client id and the first half of `x-api-key`. */
  @IsOptional()
  @IsString()
  ETSY_API_KEY?: string;

  /** The shared secret of the Etsy app: the second half of `x-api-key`; never logged. */
  @IsOptional()
  @IsString()
  ETSY_SHARED_SECRET?: string;

  /**
   * Whether plan limits block actions (`true`) or are only reported (default). Usage and limits
   * are computed either way; keep it off until billing lets merchants upgrade.
   */
  // Reads the raw value: implicit conversion would turn the string "false" into true.
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) =>
    [true, ENV_TRUE].includes(obj[key] as boolean | string),
  )
  @IsBoolean()
  ENTITLEMENTS_ENFORCED: boolean = DEFAULT_ENTITLEMENTS_ENFORCED;

  /**
   * Lets webhook endpoints use plain http and private addresses, such as an n8n on the same
   * network as a self-hosted Crossmart. Off by default: endpoints must be public, and https in
   * production. Never turn it on where untrusted users add endpoints.
   */
  // Reads the raw value: implicit conversion would turn the string "false" into true.
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) =>
    [true, ENV_TRUE].includes(obj[key] as boolean | string),
  )
  @IsBoolean()
  WEBHOOK_ALLOW_PRIVATE_URLS: boolean = DEFAULT_WEBHOOK_ALLOW_PRIVATE_URLS;

  /**
   * Anthropic API key for the AI agents (content generation). Without it the AI features report
   * that AI is not configured and the rest of the platform works as usual. Never logged.
   */
  @IsOptional()
  @IsString()
  ANTHROPIC_API_KEY?: string;

  /** The model the AI agents use. Defaults to `DEFAULT_AI_MODEL`. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  AI_MODEL?: string;

  /**
   * Ask Crossmart questions answered per UTC day, across every caller. Crossmart pays for them,
   * so this caps the bill; once reached, Ask answers 503 until midnight UTC. 0 turns Ask off.
   */
  @IsInt()
  @Min(0)
  ASK_DAILY_QUESTION_CAP: number = DEFAULT_ASK_DAILY_QUESTION_CAP;

  /** The model Ask Crossmart answers with. Defaults to `AI_MODEL`. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  ASK_AI_MODEL?: string;

  /** The address Ask Crossmart points people to when it cannot answer. */
  @IsEmail()
  ASK_SUPPORT_EMAIL: string = DEFAULT_ASK_SUPPORT_EMAIL;

  /** Who is emailed, with the whole conversation, when someone asks Ask Crossmart for a person. */
  @IsEmail()
  ASK_ESCALATION_EMAIL: string = DEFAULT_ASK_ESCALATION_EMAIL;

  /**
   * Comma-separated emails of the people who run this instance (platform admins). Signed in with
   * one of these verified addresses, they can read Ask Crossmart's conversations and answer
   * escalations. Empty by default: nobody is a platform admin.
   */
  @IsString()
  PLATFORM_ADMIN_EMAILS = '';

  /**
   * Who bills customers (ADR 0024): `none` (default) turns billing off, as self-hosting runs,
   * and `stripe` sells the plans through Stripe Checkout and the Customer Portal.
   */
  @IsEnum(BillingDriver)
  BILLING_DRIVER: BillingDriver = BillingDriver.None;

  /** Stripe secret key (`sk_...` or a restricted `rk_...`). Required with `stripe`; never logged. */
  @ValidateIf(
    (environment: EnvironmentVariables) => environment.BILLING_DRIVER === BillingDriver.Stripe,
  )
  @IsString()
  @MinLength(1)
  STRIPE_SECRET_KEY?: string;

  /**
   * Signing secret of the Stripe webhook endpoint (`whsec_...`). Without it the endpoint refuses
   * every event, so subscriptions never update; never logged.
   */
  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;

  /**
   * The Customer Portal configuration (`bpc_...`) billing admins get, which lets them switch
   * plans. `pnpm billing:sync-stripe` creates it; unset, Stripe's default portal opens.
   */
  @IsOptional()
  @IsString()
  STRIPE_PORTAL_CONFIGURATION_ID?: string;

  /**
   * Whether Stripe Tax computes sales tax and VAT at checkout. Needs Stripe Tax set up (origin
   * address, registrations) in the Stripe dashboard first; off by default.
   */
  // Reads the raw value: implicit conversion would turn the string "false" into true.
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) =>
    [true, ENV_TRUE].includes(obj[key] as boolean | string),
  )
  @IsBoolean()
  STRIPE_AUTOMATIC_TAX: boolean = DEFAULT_STRIPE_AUTOMATIC_TAX;

  /** Days of the trial a first checkout starts. 0 starts paid at once. */
  @IsInt()
  @Min(0)
  BILLING_TRIAL_DAYS: number = DEFAULT_BILLING_TRIAL_DAYS;

  /** Days a past-due organization keeps full access before it becomes read-only. */
  @IsInt()
  @Min(0)
  BILLING_PAST_DUE_GRACE_DAYS: number = DEFAULT_BILLING_PAST_DUE_GRACE_DAYS;

  /**
   * Until when organizations from before billing keep full access without a subscription (an
   * ISO date). Unset, they keep it until they choose a plan (grandfathered).
   */
  @IsOptional()
  @IsDateString()
  BILLING_LEGACY_ACCESS_UNTIL?: string;

  /** Where plans with no self-serve price, such as Enterprise, send people. */
  @IsEmail()
  BILLING_SALES_EMAIL: string = DEFAULT_BILLING_SALES_EMAIL;
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
