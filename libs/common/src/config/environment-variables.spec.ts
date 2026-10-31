import { Environment } from './environment.enum.js';
import { validateEnvironment } from './environment-variables.js';

const VALID_ENVIRONMENT = {
  NODE_ENV: 'production',
  API_PORT: '8080',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/crossmart',
  REDIS_URL: 'redis://localhost:6379',
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
  });

  it('rejects a missing database url', () => {
    const { DATABASE_URL: _databaseUrl, ...withoutDatabase } = VALID_ENVIRONMENT;

    expect(() => validateEnvironment(withoutDatabase)).toThrow(/DATABASE_URL/);
  });
});
