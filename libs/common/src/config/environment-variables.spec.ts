import { MailDriver } from '../mail/mail-driver.enum.js';
import { StorageDriver } from '../storage/storage-driver.enum.js';
import { BillingDriver } from './billing-driver.enum.js';
import { EbayEnvironment } from './ebay-environment.enum.js';
import { Environment } from './environment.enum.js';
import { validateEnvironment } from './environment-variables.js';

const VALID_ENVIRONMENT = {
  NODE_ENV: 'production',
  API_PORT: '8080',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/crossmart',
  REDIS_URL: 'redis://localhost:6379',
  BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-32-characters',
  BETTER_AUTH_URL: 'http://localhost:3000',
};

describe('validateEnvironment', () => {
  it('parses and converts a valid environment', () => {
    const environment = validateEnvironment(VALID_ENVIRONMENT);

    expect(environment.NODE_ENV).toBe(Environment.Production);
    expect(environment.API_PORT).toBe(8080);
  });

  it('keeps webhook endpoints public unless a self-hosted instance opts out', () => {
    expect(validateEnvironment(VALID_ENVIRONMENT).WEBHOOK_ALLOW_PRIVATE_URLS).toBe(false);
    expect(
      validateEnvironment({ ...VALID_ENVIRONMENT, WEBHOOK_ALLOW_PRIVATE_URLS: 'true' })
        .WEBHOOK_ALLOW_PRIVATE_URLS,
    ).toBe(true);
    expect(
      validateEnvironment({ ...VALID_ENVIRONMENT, WEBHOOK_ALLOW_PRIVATE_URLS: 'false' })
        .WEBHOOK_ALLOW_PRIVATE_URLS,
    ).toBe(false);
  });

  it('applies defaults for optional variables', () => {
    const { NODE_ENV: _nodeEnv, API_PORT: _apiPort, ...required } = VALID_ENVIRONMENT;

    const environment = validateEnvironment(required);

    expect(environment.NODE_ENV).toBe(Environment.Development);
    expect(environment.API_PORT).toBe(3000);
    expect(environment.STORAGE_DRIVER).toBe(StorageDriver.Local);
  });

  it('reports plan limits without enforcing them unless enabled', () => {
    expect(validateEnvironment(VALID_ENVIRONMENT).ENTITLEMENTS_ENFORCED).toBe(false);
    const enforcing = (value: string) =>
      validateEnvironment({ ...VALID_ENVIRONMENT, ENTITLEMENTS_ENFORCED: value })
        .ENTITLEMENTS_ENFORCED;
    expect(enforcing('true')).toBe(true);
    expect(enforcing('false')).toBe(false);
    expect(enforcing('')).toBe(false);
  });

  it('rejects an unknown storage driver', () => {
    expect(() => validateEnvironment({ ...VALID_ENVIRONMENT, STORAGE_DRIVER: 'ftp' })).toThrow(
      /STORAGE_DRIVER/,
    );
  });

  it('rejects a missing database url', () => {
    const { DATABASE_URL: _databaseUrl, ...withoutDatabase } = VALID_ENVIRONMENT;

    expect(() => validateEnvironment(withoutDatabase)).toThrow(/DATABASE_URL/);
  });

  it('rejects an auth secret that is too short', () => {
    expect(() =>
      validateEnvironment({ ...VALID_ENVIRONMENT, BETTER_AUTH_SECRET: 'short' }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('logs email by default and needs a Resend key to send for real', () => {
    expect(validateEnvironment(VALID_ENVIRONMENT).MAIL_DRIVER).toBe(MailDriver.Log);
    expect(() => validateEnvironment({ ...VALID_ENVIRONMENT, MAIL_DRIVER: 'resend' })).toThrow(
      /RESEND_API_KEY/,
    );
    const sending = validateEnvironment({
      ...VALID_ENVIRONMENT,
      MAIL_DRIVER: 'resend',
      RESEND_API_KEY: 're_test',
    });
    expect(sending.MAIL_DRIVER).toBe(MailDriver.Resend);
  });

  it('reads the eBay environment, sandbox by default', () => {
    expect(validateEnvironment(VALID_ENVIRONMENT).EBAY_ENVIRONMENT).toBe(EbayEnvironment.Sandbox);
    expect(
      validateEnvironment({ ...VALID_ENVIRONMENT, EBAY_ENVIRONMENT: 'production' })
        .EBAY_ENVIRONMENT,
    ).toBe(EbayEnvironment.Production);
    expect(() => validateEnvironment({ ...VALID_ENVIRONMENT, EBAY_ENVIRONMENT: 'live' })).toThrow(
      /EBAY_ENVIRONMENT/,
    );
  });

  it('accepts an eBay verification token only in the shape eBay allows', () => {
    const withToken = (token: string) =>
      validateEnvironment({ ...VALID_ENVIRONMENT, EBAY_VERIFICATION_TOKEN: token })
        .EBAY_VERIFICATION_TOKEN;

    expect(withToken('Crossmart_verification-token_0123456789abcdef')).toBe(
      'Crossmart_verification-token_0123456789abcdef',
    );
    expect(withToken('')).toBe('');
    for (const invalid of ['too-short', 'a'.repeat(81), `${'a'.repeat(32)}!`]) {
      expect(() => withToken(invalid)).toThrow(/EBAY_VERIFICATION_TOKEN/);
    }
  });

  it('keeps billing off by default and needs a Stripe key to bill through Stripe', () => {
    const selfHosted = validateEnvironment(VALID_ENVIRONMENT);
    expect(selfHosted.BILLING_DRIVER).toBe(BillingDriver.None);
    expect(selfHosted.BILLING_TRIAL_DAYS).toBe(7);
    expect(selfHosted.BILLING_PAST_DUE_GRACE_DAYS).toBe(7);
    expect(() => validateEnvironment({ ...VALID_ENVIRONMENT, BILLING_DRIVER: 'stripe' })).toThrow(
      /STRIPE_SECRET_KEY/,
    );
    const billing = validateEnvironment({
      ...VALID_ENVIRONMENT,
      BILLING_DRIVER: 'stripe',
      STRIPE_SECRET_KEY: 'sk_test_example',
    });
    expect(billing.BILLING_DRIVER).toBe(BillingDriver.Stripe);
  });

  it('accepts only a date as the end of legacy access', () => {
    const withDate = (value: string) =>
      validateEnvironment({ ...VALID_ENVIRONMENT, BILLING_LEGACY_ACCESS_UNTIL: value });

    expect(withDate('2026-12-31').BILLING_LEGACY_ACCESS_UNTIL).toBe('2026-12-31');
    expect(() => withDate('next month')).toThrow(/BILLING_LEGACY_ACCESS_UNTIL/);
  });
});
