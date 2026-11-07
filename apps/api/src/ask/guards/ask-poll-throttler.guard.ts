import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { askCallerTracker } from './ask-throttler.guard.js';

/**
 * Rate limits reads that cost no AI, such as polling an escalation: the API's default window
 * (`DEFAULT_REQUESTS_PER_WINDOW` a minute), per address or caller like Ask's own limits.
 */
@Injectable()
export class AskPollThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: AuthenticatedRequest): Promise<string> {
    return Promise.resolve(askCallerTracker(request));
  }
}
