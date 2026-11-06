import { Injectable } from '@nestjs/common';
import { AccountEmailsService } from '@crossmart/core';
import { RedisAuthRateLimitStorage } from '../rate-limit/redis-auth-rate-limit.storage.js';

/** What Better Auth calls out to besides the database: account emails and rate-limit windows. */
@Injectable()
export class BetterAuthServices {
  constructor(
    readonly accountEmails: AccountEmailsService,
    readonly rateLimitStorage: RedisAuthRateLimitStorage,
  ) {}
}
