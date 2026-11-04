import { Injectable } from '@nestjs/common';
import { IMPORT_STALE_AFTER_MS } from '../channel-import.constants.js';
import { ChannelImportJobRepository } from '../repositories/channel-import-job.repository.js';
import { StalledImportError } from '../rules/stalled-import.error.js';
import { ChannelImportReporter } from './channel-import.reporter.js';

/**
 * Closes channel imports whose worker died mid-way (a deploy, a crash, a lost queue), so they
 * stop showing as running forever and the store can be imported again. Each is marked failed
 * with a reason that says to start it again, and logged as activity.
 */
@Injectable()
export class StalledImportSweeper {
  constructor(
    private readonly jobs: ChannelImportJobRepository,
    private readonly reporter: ChannelImportReporter,
  ) {}

  /** How many imports were closed. */
  async sweep(now: Date = new Date()): Promise<number> {
    const stalled = await this.jobs.findStalled(new Date(now.getTime() - IMPORT_STALE_AFTER_MS));
    for (const job of stalled) {
      await this.reporter.failed(job, new StalledImportError());
    }
    return stalled.length;
  }
}
