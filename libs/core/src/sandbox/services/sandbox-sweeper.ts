import { Injectable } from '@nestjs/common';
import { generateSecureToken, hashSecret } from '@crossmart/common';
import type { SandboxReminder, SandboxSweepResult } from '../entities/sandbox-account.js';
import { SandboxSweepRepository } from '../repositories/sandbox-sweep.repository.js';
import {
  SANDBOX_CLAIM_REMINDER_AFTER_MS,
  SANDBOX_CLAIM_TOKEN_BYTES,
  SANDBOX_SWEEP_BATCH_SIZE,
  SANDBOX_SWEEP_MAX_BATCHES,
} from '../sandbox.constants.js';
import { SandboxClaimMailer } from './sandbox-claim.mailer.js';

type BatchStep = () => Promise<{ found: number; done: number }>;

/** Runs `step` until a batch comes back short or empty, or the sweep's batch budget is spent. */
async function inBatches(step: BatchStep): Promise<number> {
  let total = 0;
  for (let batch = 0; batch < SANDBOX_SWEEP_MAX_BATCHES; batch += 1) {
    const { found, done } = await step();
    total += done;
    if (found < SANDBOX_SWEEP_BATCH_SIZE || done === 0) break;
  }
  return total;
}

/**
 * Hourly housekeeping of sandbox accounts (ADR 0019): the claim email goes out once more three
 * days after the first, with a new link, and a sandbox still unclaimed after 14 days is deleted
 * with everything in it. Both work in batches, and running the sweep twice does nothing more.
 */
@Injectable()
export class SandboxSweeper {
  constructor(
    private readonly sweeps: SandboxSweepRepository,
    private readonly mailer: SandboxClaimMailer,
  ) {}

  async sweep(now = new Date()): Promise<SandboxSweepResult> {
    const reminded = await inBatches(() => this.remindBatch(now));
    const deleted = await inBatches(() => this.deleteBatch(now));
    return { reminded, deleted };
  }

  private async remindBatch(now: Date): Promise<{ found: number; done: number }> {
    const sentBefore = new Date(now.getTime() - SANDBOX_CLAIM_REMINDER_AFTER_MS);
    const due = await this.sweeps.findDueReminders(sentBefore, now, SANDBOX_SWEEP_BATCH_SIZE);
    let done = 0;
    for (const sandbox of due) {
      if (await this.remind(sandbox, now)) done += 1;
    }
    return { found: due.length, done };
  }

  /** Only the hash is stored, so the reminder carries a new token; the first link stops working. */
  private async remind(sandbox: SandboxReminder, now: Date): Promise<boolean> {
    const token = generateSecureToken(SANDBOX_CLAIM_TOKEN_BYTES);
    if (!(await this.sweeps.markReminded(sandbox.id, hashSecret(token), now))) return false;
    const { email, storeName, expiresAt } = sandbox;
    this.mailer.sendReminder({ email, storeName, token, expiresAt });
    return true;
  }

  private async deleteBatch(now: Date): Promise<{ found: number; done: number }> {
    const ids = await this.sweeps.findExpiredIds(now, SANDBOX_SWEEP_BATCH_SIZE);
    let done = 0;
    for (const id of ids) {
      if (await this.sweeps.deleteExpired(id, now)) done += 1;
    }
    return { found: ids.length, done };
  }
}
