import { MailDriver } from '../mail/mail-driver.enum.js';
import { StorageDriver } from '../storage/storage-driver.enum.js';
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
});
