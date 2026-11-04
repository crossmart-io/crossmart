import type { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service.js';
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
});
