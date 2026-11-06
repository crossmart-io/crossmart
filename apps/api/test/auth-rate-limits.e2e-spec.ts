import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import type { App } from 'supertest/types.js';
import { RedisAuthRateLimitStorage } from '../src/auth/rate-limit/redis-auth-rate-limit.storage.js';
import { createTestApp } from './support/test-app.js';

/**
 * Better Auth's rate limits against the real Redis (ADR 0019). Better Auth only enforces them in
 * production, so this drives the storage it is given directly.
 */
describe('Auth rate limits in Redis (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('shares one window per client IP and path, which expires with the rule', async () => {
    const storage = app.get(RedisAuthRateLimitStorage, { strict: false });
    const otherInstance = new RedisAuthRateLimitStorage(app.get(Redis, { strict: false }));
    const key = `198.51.100.${Math.floor(Math.random() * 250)}|/oauth2/token-${randomUUID()}`;
    const rule = { window: 60, max: 2 };

    const decisions = [
      await storage.consume(key, rule),
      await otherInstance.consume(key, rule),
      await storage.consume(key, rule),
    ];

    expect(decisions.map((decision) => decision.allowed)).toEqual([true, true, false]);
    expect(decisions[2]?.retryAfter).toBeGreaterThan(0);
    const ttl = await app.get(Redis, { strict: false }).pttl(`crossmart:auth-rate-limit:${key}`);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60_000);
  });
});
