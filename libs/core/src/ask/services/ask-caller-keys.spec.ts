import type { AppConfigService } from '@crossmart/common';
import { WEBHOOK_SECRET_PREFIX } from '../../webhooks/webhooks.constants.js';
import type { AskCallerIdentity } from '../entities/ask-caller.js';
import { AskCallerType } from '../enums/ask-caller-type.enum.js';
import { AskCallerKeys } from './ask-caller-keys.js';

const SECRET = 'a-test-secret-that-is-long-enough-123456';
const ANONYMOUS: AskCallerIdentity = {
  type: AskCallerType.Anonymous,
  principalKey: null,
  clientName: null,
  userId: null,
  workspace: null,
  ip: '203.0.113.7',
  userAgent: 'curl/8.0',
};

const keys = (secret = SECRET) => new AskCallerKeys({ authSecret: secret } as AppConfigService);

describe('AskCallerKeys', () => {
  it('never keeps the address or user agent, only a salted hash of them', () => {
    const caller = keys().callerFrom(ANONYMOUS);

    expect(JSON.stringify(caller)).not.toContain(ANONYMOUS.ip);
    expect(JSON.stringify(caller)).not.toContain(ANONYMOUS.userAgent);
    expect(caller.clientFingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('gives the same caller the same keys, and another secret other keys', () => {
    expect(keys().callerFrom(ANONYMOUS)).toEqual(keys().callerFrom(ANONYMOUS));
    expect(keys('another-secret-that-is-long-enough-0000').callerFrom(ANONYMOUS).ownerKey).not.toBe(
      keys().callerFrom(ANONYMOUS).ownerKey,
    );
  });

  it('binds an identified caller to who they are, wherever they call from', () => {
    const user = { ...ANONYMOUS, type: AskCallerType.User, principalKey: 'user:42' };

    expect(keys().callerFrom(user).ownerKey).toBe(
      keys().callerFrom({ ...user, ip: '198.51.100.1' }).ownerKey,
    );
    expect(keys().callerFrom(user).ownerKey).not.toBe(keys().callerFrom(ANONYMOUS).ownerKey);
  });

  it('derives a webhook-style secret per escalation', () => {
    const secret = keys().callbackSecret('esc_one');

    expect(secret.startsWith(WEBHOOK_SECRET_PREFIX)).toBe(true);
    expect(secret).toBe(keys().callbackSecret('esc_one'));
    expect(secret).not.toBe(keys().callbackSecret('esc_two'));
  });
});
