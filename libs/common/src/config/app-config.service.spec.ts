import type { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service.js';
import { BillingDriver } from './billing-driver.enum.js';
import { DEFAULT_AI_MODEL } from './config.constants.js';
import { EbayEnvironment } from './ebay-environment.enum.js';
import type { EnvironmentVariables } from './environment-variables.js';

const EBAY_VARIABLES = {
  EBAY_CLIENT_ID: 'test-app-id',
  EBAY_CLIENT_SECRET: 'test-cert-id',
  EBAY_RU_NAME: 'Test_Seller-TestApp-SBX-abc',
  EBAY_ENVIRONMENT: EbayEnvironment.Sandbox,
};

function appConfig(variables: Partial<EnvironmentVariables>): AppConfigService {
  const configService = {
    get: (key: keyof EnvironmentVariables) => variables[key],
  } as ConfigService<EnvironmentVariables, true>;
  return new AppConfigService(configService);
}

describe('AppConfigService', () => {
  describe('ebayApp', () => {
    it('returns the keyset, RuName and environment when all are set', () => {
      expect(appConfig(EBAY_VARIABLES).ebayApp).toEqual({
        clientId: 'test-app-id',
        clientSecret: 'test-cert-id',
        ruName: 'Test_Seller-TestApp-SBX-abc',
        environment: EbayEnvironment.Sandbox,
      });
    });

    it.each(['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET', 'EBAY_RU_NAME'] as const)(
      'is null without %s',
      (missing) => {
        expect(appConfig({ ...EBAY_VARIABLES, [missing]: undefined }).ebayApp).toBeNull();
      },
    );
  });

  describe('etsyApp', () => {
    const ETSY_VARIABLES = { ETSY_API_KEY: 'test-keystring', ETSY_SHARED_SECRET: 'test-secret' };

    it('returns the keystring and shared secret when both are set', () => {
      expect(appConfig(ETSY_VARIABLES).etsyApp).toEqual({
        clientId: 'test-keystring',
        clientSecret: 'test-secret',
      });
    });

    it.each(['ETSY_API_KEY', 'ETSY_SHARED_SECRET'] as const)('is null without %s', (missing) => {
      expect(appConfig({ ...ETSY_VARIABLES, [missing]: undefined }).etsyApp).toBeNull();
      expect(appConfig({ ...ETSY_VARIABLES, [missing]: '' }).etsyApp).toBeNull();
    });
  });

  describe('ebayVerificationToken', () => {
    it('returns the token, and null when it is unset or empty', () => {
      const token = 'Crossmart_verification-token_0123456789abcdef';

      expect(appConfig({ EBAY_VERIFICATION_TOKEN: token }).ebayVerificationToken).toBe(token);
      expect(appConfig({ EBAY_VERIFICATION_TOKEN: '' }).ebayVerificationToken).toBeNull();
      expect(appConfig({}).ebayVerificationToken).toBeNull();
    });
  });

  describe('aiSettings', () => {
    it('has no key and the default model when nothing is set', () => {
      expect(appConfig({}).aiSettings).toEqual({ anthropicApiKey: null, model: DEFAULT_AI_MODEL });
    });

    it('treats an empty key as missing', () => {
      expect(appConfig({ ANTHROPIC_API_KEY: '' }).aiSettings.anthropicApiKey).toBeNull();
    });

    it('returns the key and the model override', () => {
      expect(
        appConfig({ ANTHROPIC_API_KEY: 'sk-test', AI_MODEL: 'claude-opus-5-5' }).aiSettings,
      ).toEqual({ anthropicApiKey: 'sk-test', model: 'claude-opus-5-5' });
    });
  });

  describe('askSettings', () => {
    it('falls back to the AI agents’ model when no Ask model is set', () => {
      expect(
        appConfig({
          ASK_DAILY_QUESTION_CAP: 50,
          ASK_SUPPORT_EMAIL: 'help@example.com',
          ASK_ESCALATION_EMAIL: 'team@example.com',
        }).askSettings,
      ).toEqual({
        dailyQuestionCap: 50,
        model: null,
        supportEmail: 'help@example.com',
        escalationEmail: 'team@example.com',
      });
    });

    it('returns the Ask model override', () => {
      expect(appConfig({ ASK_AI_MODEL: 'claude-haiku-5-5' }).askSettings.model).toBe(
        'claude-haiku-5-5',
      );
    });
  });

  describe('platformAdminEmails', () => {
    it('reads a comma-separated list, trimmed and in lower case', () => {
      expect([
        ...appConfig({ PLATFORM_ADMIN_EMAILS: ' Yariv@Crossmart.io, ,ops@example.com ' })
          .platformAdminEmails,
      ]).toEqual(['yariv@crossmart.io', 'ops@example.com']);
    });

    it('has nobody when the list is empty', () => {
      expect(appConfig({ PLATFORM_ADMIN_EMAILS: '' }).platformAdminEmails.size).toBe(0);
    });
  });

  describe('billingSettings', () => {
    const DEFAULTS = {
      BILLING_TRIAL_DAYS: 7,
      BILLING_PAST_DUE_GRACE_DAYS: 7,
      BILLING_SALES_EMAIL: 'hello@crossmart.io',
    };

    it('is off with no Stripe settings when the driver is none', () => {
      const config = appConfig({ ...DEFAULTS, BILLING_DRIVER: BillingDriver.None });

      expect(config.billingEnabled).toBe(false);
      expect(config.billingSettings).toMatchObject({ stripe: null, legacyAccessUntil: null });
    });

    it('reads the Stripe keys and the end of legacy access', () => {
      const config = appConfig({
        ...DEFAULTS,
        BILLING_DRIVER: BillingDriver.Stripe,
        STRIPE_SECRET_KEY: 'sk_test_example',
        STRIPE_WEBHOOK_SECRET: '',
        STRIPE_AUTOMATIC_TAX: false,
        BILLING_LEGACY_ACCESS_UNTIL: '2026-12-31',
      });

      expect(config.billingEnabled).toBe(true);
      expect(config.billingSettings).toEqual({
        driver: BillingDriver.Stripe,
        stripe: {
          secretKey: 'sk_test_example',
          webhookSecret: null,
          automaticTax: false,
          portalConfigurationId: null,
        },
        trialDays: 7,
        pastDueGraceDays: 7,
        legacyAccessUntil: new Date('2026-12-31'),
        salesEmail: 'hello@crossmart.io',
      });
    });
  });
});
