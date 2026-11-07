import { hashSecret } from '@crossmart/common';
import type { SandboxReminder } from '../entities/sandbox-account.js';
import type { SandboxSweepRepository } from '../repositories/sandbox-sweep.repository.js';
import {
  SANDBOX_CLAIM_REMINDER_AFTER_MS,
  SANDBOX_SWEEP_BATCH_SIZE,
  SANDBOX_SWEEP_MAX_BATCHES,
} from '../sandbox.constants.js';
import type { SandboxClaimMailer } from './sandbox-claim.mailer.js';
import { SandboxSweeper } from './sandbox-sweeper.js';

const NOW = new Date('2026-11-20T12:00:00.000Z');
const REMINDER: SandboxReminder = {
  id: 'sb-1',
  email: 'ana@example.com',
  storeName: 'Ana Ceramics',
  expiresAt: new Date('2026-11-28T12:00:00.000Z'),
};

function setup() {
  const sweeps = {
    findDueReminders: vi.fn<SandboxSweepRepository['findDueReminders']>().mockResolvedValue([]),
    markReminded: vi.fn<SandboxSweepRepository['markReminded']>().mockResolvedValue(true),
    findExpiredIds: vi.fn<SandboxSweepRepository['findExpiredIds']>().mockResolvedValue([]),
    deleteExpired: vi.fn<SandboxSweepRepository['deleteExpired']>().mockResolvedValue(true),
  };
  const mailer = { sendReminder: vi.fn<SandboxClaimMailer['sendReminder']>() };
  const sweeper = new SandboxSweeper(
    sweeps as unknown as SandboxSweepRepository,
    mailer as unknown as SandboxClaimMailer,
  );
  return { sweeper, sweeps, mailer };
}

describe('SandboxSweeper', () => {
  it('reminds sandboxes first emailed three days ago, with a new link', async () => {
    const { sweeper, sweeps, mailer } = setup();
    sweeps.findDueReminders.mockResolvedValueOnce([REMINDER]);

    expect(await sweeper.sweep(NOW)).toEqual({ reminded: 1, deleted: 0 });
    expect(sweeps.findDueReminders).toHaveBeenCalledWith(
      new Date(NOW.getTime() - SANDBOX_CLAIM_REMINDER_AFTER_MS),
      NOW,
      SANDBOX_SWEEP_BATCH_SIZE,
    );
    const link = mailer.sendReminder.mock.calls[0]?.[0];
    expect(link).toMatchObject({ email: REMINDER.email, expiresAt: REMINDER.expiresAt });
    expect(sweeps.markReminded).toHaveBeenCalledWith('sb-1', hashSecret(link?.token ?? ''), NOW);
  });

  it('sends nothing for a sandbox reminded or claimed meanwhile', async () => {
    const { sweeper, sweeps, mailer } = setup();
    sweeps.findDueReminders.mockResolvedValueOnce([REMINDER]);
    sweeps.markReminded.mockResolvedValueOnce(false);

    expect(await sweeper.sweep(NOW)).toEqual({ reminded: 0, deleted: 0 });
    expect(mailer.sendReminder).not.toHaveBeenCalled();
  });

  it('deletes expired sandboxes in batches until a batch comes back short', async () => {
    const { sweeper, sweeps } = setup();
    const fullBatch = Array.from({ length: SANDBOX_SWEEP_BATCH_SIZE }, (_, index) => `sb-${index}`);
    sweeps.findExpiredIds.mockResolvedValueOnce(fullBatch).mockResolvedValueOnce(['sb-last']);

    expect(await sweeper.sweep(NOW)).toEqual({
      reminded: 0,
      deleted: SANDBOX_SWEEP_BATCH_SIZE + 1,
    });
    expect(sweeps.findExpiredIds).toHaveBeenCalledTimes(2);
    expect(sweeps.deleteExpired).toHaveBeenCalledWith('sb-last', NOW);
  });

  it('stops when a batch deletes nothing, and never runs past its batch budget', async () => {
    const { sweeper, sweeps } = setup();
    const fullBatch = Array.from({ length: SANDBOX_SWEEP_BATCH_SIZE }, (_, index) => `sb-${index}`);
    sweeps.findExpiredIds.mockResolvedValue(fullBatch);

    await sweeper.sweep(NOW);
    expect(sweeps.findExpiredIds).toHaveBeenCalledTimes(SANDBOX_SWEEP_MAX_BATCHES);

    sweeps.findExpiredIds.mockClear();
    sweeps.deleteExpired.mockResolvedValue(false);
    expect((await sweeper.sweep(NOW)).deleted).toBe(0);
    expect(sweeps.findExpiredIds).toHaveBeenCalledTimes(1);
  });
});
