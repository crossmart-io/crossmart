import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MailDriver } from '../mail/mail-driver.enum.js';
import { StorageDriver } from '../storage/storage-driver.enum.js';
import { CORS_ORIGINS_SEPARATOR } from './config.constants.js';
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
}
