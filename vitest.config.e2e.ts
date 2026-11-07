import { defineConfig } from 'vitest/config';
import { sharedConfig } from './vitest.config.js';

/**
 * Settings every e2e run starts from, whatever the local `.env` says, so no test reaches a real
 * provider. A test that needs one on sets it in `vi.hoisted` and overrides the provider.
 */
const E2E_ENVIRONMENT = { BILLING_DRIVER: 'none' };

export default defineConfig({
  ...sharedConfig,
  test: { ...sharedConfig.test, include: ['**/*.e2e-spec.ts'], env: E2E_ENVIRONMENT },
});
