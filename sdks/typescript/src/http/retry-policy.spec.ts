import { describe, expect, it } from 'vitest';
import { parseRetryAfter, RetryPolicy } from './retry-policy.js';

const NOW = Date.parse('2026-11-05T12:00:00Z');
const noJitter = (): number => 0;

describe('parseRetryAfter', () => {
  it('reads delay-seconds', () => {
    expect(parseRetryAfter('3', NOW)).toBe(3000);
    expect(parseRetryAfter('0', NOW)).toBe(0);
  });

  it('reads an HTTP date', () => {
    expect(parseRetryAfter('Thu, 05 Nov 2026 12:00:05 GMT', NOW)).toBe(5000);
  });

  it('never returns a negative delay', () => {
    expect(parseRetryAfter('Thu, 05 Nov 2026 11:00:00 GMT', NOW)).toBe(0);
  });

  it('ignores a missing or unreadable header', () => {
    expect(parseRetryAfter(null, NOW)).toBeUndefined();
    expect(parseRetryAfter('', NOW)).toBeUndefined();
    expect(parseRetryAfter('soon', NOW)).toBeUndefined();
  });
});

describe('RetryPolicy', () => {
  it('retries idempotent methods only', () => {
    const policy = new RetryPolicy();
    for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'get']) {
      expect(policy.canRetry(method)).toBe(true);
    }
    expect(policy.canRetry('POST')).toBe(false);
    expect(policy.canRetry('PATCH')).toBe(false);
  });

  it('retries nothing when maxRetries is 0', () => {
    expect(new RetryPolicy({ maxRetries: 0 }).canRetry('GET')).toBe(false);
  });

  it('retries 429 and 5xx', () => {
    const policy = new RetryPolicy();
    expect(policy.isRetryableStatus(429)).toBe(true);
    expect(policy.isRetryableStatus(500)).toBe(true);
    expect(policy.isRetryableStatus(503)).toBe(true);
    expect(policy.isRetryableStatus(400)).toBe(false);
    expect(policy.isRetryableStatus(404)).toBe(false);
  });

  it('backs off exponentially up to the cap', () => {
    const policy = new RetryPolicy({ initialDelayMs: 100, maxDelayMs: 350 }, noJitter);
    expect([0, 1, 2, 3].map((attempt) => policy.backoffDelay(attempt))).toEqual([
      100, 200, 350, 350,
    ]);
  });

  it('shortens delays by up to a quarter for jitter', () => {
    const policy = new RetryPolicy({ initialDelayMs: 1000 }, () => 1);
    expect(policy.backoffDelay(0)).toBe(750);
  });

  it('waits as long as Retry-After asks', () => {
    const policy = new RetryPolicy({}, noJitter);
    const response = new Response(null, { status: 429, headers: { 'retry-after': '2' } });
    expect(policy.delayAfterResponse(response, 0, NOW)).toBe(2000);
  });

  it('gives up when Retry-After asks for more than a minute', () => {
    const policy = new RetryPolicy({}, noJitter);
    const response = new Response(null, { status: 429, headers: { 'retry-after': '120' } });
    expect(policy.delayAfterResponse(response, 0, NOW)).toBeNull();
  });
});
