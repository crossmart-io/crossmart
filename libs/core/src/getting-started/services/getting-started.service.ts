import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import type { GettingStarted } from '../entities/getting-started.js';
import { GettingStartedRepository } from '../repositories/getting-started.repository.js';
import { gettingStarted } from '../rules/getting-started-steps.js';

/**
 * Where a new account stands and what to do next, for an agent that just connected to an empty
 * workspace: which steps it can take with its tools, and which only the seller can take, with
 * links to the app.
 */
@Injectable()
export class GettingStartedService {
  constructor(
    private readonly repository: GettingStartedRepository,
    private readonly config: AppConfigService,
  ) {}

  /** `userId` is the person behind the call, whose email confirmation is reported. */
  async read(workspaceId: string, userId: string): Promise<GettingStarted> {
    const progress = await this.repository.progress(workspaceId, userId, new Date());
    return gettingStarted(progress, this.config.webAppUrl);
  }
}
