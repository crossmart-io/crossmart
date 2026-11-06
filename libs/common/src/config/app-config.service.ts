import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MailDriver } from '../mail/mail-driver.enum.js';
import { StorageDriver } from '../storage/storage-driver.enum.js';
import { CORS_ORIGINS_SEPARATOR, DEFAULT_AI_MODEL } from './config.constants.js';
import type { EbayEnvironment } from './ebay-environment.enum.js';
import { Environment } from './environment.enum.js';
import type { EnvironmentVariables } from './environment-variables.js';
import type { MasterKeySettings } from '../crypto/envelope/master-key-ring.js';

/** Credentials of an OAuth app a channel issued to Crossmart. */
export interface OAuthAppCredentials {
  clientId: string;
  clientSecret: string;
}

/** The eBay keyset and RuName Crossmart signs merchants in with. */
export interface EbayAppSettings extends OAuthAppCredentials {
  /** The redirect URL name eBay issued for the callback; sent as `redirect_uri`. */
  ruName: string;
  environment: EbayEnvironment;
}

/** The AI provider's key and model. The key is null when AI is not configured. */
export interface AiSettings {
  anthropicApiKey: string | null;
  model: string;
}

/** Ask Crossmart: how many questions a day it answers, with which model, and who to email. */
export interface AskSettings {
  dailyQuestionCap: number;
  /** Null to answer with the AI agents' model. */
  model: string | null;
  supportEmail: string;
}

export interface MailSettings {
  driver: MailDriver;
  /** Set whenever the driver is `resend`; validation refuses to start without it. */
  resendApiKey: string;
  from: string;
}

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

  get storageDriver(): StorageDriver {
    return this.configService.get('STORAGE_DRIVER', { infer: true });
  }

  get storageLocalDir(): string {
    return this.configService.get('STORAGE_LOCAL_DIR', { infer: true });
  }

  get mediaPublicUrl(): string {
    return this.configService.get('MEDIA_PUBLIC_URL', { infer: true });
  }

  /** Where channels reach this API: `API_PUBLIC_URL`, else `BETTER_AUTH_URL`. */
  get apiPublicUrl(): string {
    return this.configService.get('API_PUBLIC_URL', { infer: true }) ?? this.authBaseUrl;
  }

  get webAppUrl(): string {
    return this.configService.get('WEB_APP_URL', { infer: true });
  }

  /** The remote MCP server's address: the audience of agent access tokens. */
  get mcpPublicUrl(): string {
    return this.configService.get('MCP_PUBLIC_URL', { infer: true });
  }

  get masterKeySettings(): MasterKeySettings {
    return {
      currentKey: this.configService.get('CREDENTIALS_MASTER_KEY', { infer: true }),
      currentVersion: this.configService.get('CREDENTIALS_MASTER_KEY_VERSION', { infer: true }),
      retiredKeys: this.configService.get('CREDENTIALS_RETIRED_MASTER_KEYS', { infer: true }),
    };
  }

  get mailSettings(): MailSettings {
    return {
      driver: this.configService.get('MAIL_DRIVER', { infer: true }),
      resendApiKey: this.configService.get('RESEND_API_KEY', { infer: true }) ?? '',
      from: this.configService.get('MAIL_FROM', { infer: true }),
    };
  }

  /** The Shopify app, or null when this instance has none configured. */
  get shopifyApp(): OAuthAppCredentials | null {
    const clientId = this.configService.get('SHOPIFY_CLIENT_ID', { infer: true });
    const clientSecret = this.configService.get('SHOPIFY_CLIENT_SECRET', { infer: true });
    return clientId && clientSecret ? { clientId, clientSecret } : null;
  }

  /** The eBay app, or null unless its client id, secret and RuName are all set. */
  get ebayApp(): EbayAppSettings | null {
    const clientId = this.configService.get('EBAY_CLIENT_ID', { infer: true });
    const clientSecret = this.configService.get('EBAY_CLIENT_SECRET', { infer: true });
    const ruName = this.configService.get('EBAY_RU_NAME', { infer: true });
    if (!clientId || !clientSecret || !ruName) {
      return null;
    }
    const environment = this.configService.get('EBAY_ENVIRONMENT', { infer: true });
    return { clientId, clientSecret, ruName, environment };
  }

  /** The token of eBay's account deletion endpoint challenge, or null when it is not set. */
  get ebayVerificationToken(): string | null {
    return this.configService.get('EBAY_VERIFICATION_TOKEN', { infer: true }) || null;
  }

  /** The Google Cloud OAuth app for Google Merchant Center, or null without one. */
  get googleApp(): OAuthAppCredentials | null {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID', { infer: true });
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET', { infer: true });
    return clientId && clientSecret ? { clientId, clientSecret } : null;
  }

  /**
   * The Etsy app, or null unless its keystring and shared secret are both set. The keystring
   * is the OAuth client id; Etsy's OAuth uses PKCE, so the secret only signs API calls.
   */
  get etsyApp(): OAuthAppCredentials | null {
    const clientId = this.configService.get('ETSY_API_KEY', { infer: true });
    const clientSecret = this.configService.get('ETSY_SHARED_SECRET', { infer: true });
    return clientId && clientSecret ? { clientId, clientSecret } : null;
  }

  /** Whether plan limits block actions; when false they are only reported. */
  get entitlementsEnforced(): boolean {
    return this.configService.get('ENTITLEMENTS_ENFORCED', { infer: true });
  }

  /** The AI agents' settings; AI features are off while the key is missing. */
  get aiSettings(): AiSettings {
    return {
      anthropicApiKey: this.configService.get('ANTHROPIC_API_KEY', { infer: true }) || null,
      model: this.configService.get('AI_MODEL', { infer: true }) ?? DEFAULT_AI_MODEL,
    };
  }

  /** Ask Crossmart's daily cap, model and support address. */
  get askSettings(): AskSettings {
    return {
      dailyQuestionCap: this.configService.get('ASK_DAILY_QUESTION_CAP', { infer: true }),
      model: this.configService.get('ASK_AI_MODEL', { infer: true }) ?? null,
      supportEmail: this.configService.get('ASK_SUPPORT_EMAIL', { infer: true }),
    };
  }
}
