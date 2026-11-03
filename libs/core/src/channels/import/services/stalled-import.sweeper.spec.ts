import type {
  ChannelImportJobRepository,
  ChannelImportRunRecord,
} from '../repositories/channel-import-job.repository.js';
import { IMPORT_STALE_AFTER_MS, IMPORT_STALLED_REASON } from '../channel-import.constants.js';
import { StalledImportError } from '../rules/stalled-import.error.js';
import { toImportFailureReason } from '../rules/import-failure.js';
import type { ChannelImportReporter } from './channel-import.reporter.js';
import { StalledImportSweeper } from './stalled-import.sweeper.js';

const NOW = new Date('2026-11-04T12:00:00Z');

describe('StalledImportSweeper', () => {
  it('fails each import that wrote nothing for too long, saying to start it again', async () => {
    const stalled = [{ id: 'job-1' }, { id: 'job-2' }] as ChannelImportRunRecord[];
    const jobs = {
      findStalled: vi.fn<ChannelImportJobRepository['findStalled']>().mockResolvedValue(stalled),
    };
    const reporter = { failed: vi.fn<ChannelImportReporter['failed']>().mockResolvedValue() };
    const sweeper = new StalledImportSweeper(
      jobs as unknown as ChannelImportJobRepository,
      reporter as unknown as ChannelImportReporter,
    );

    expect(await sweeper.sweep(NOW)).toBe(2);

    expect(jobs.findStalled).toHaveBeenCalledWith(new Date(NOW.getTime() - IMPORT_STALE_AFTER_MS));
    expect(reporter.failed).toHaveBeenCalledTimes(2);
    const [, error] = reporter.failed.mock.calls[0]!;
    expect(error).toBeInstanceOf(StalledImportError);
    expect(toImportFailureReason(error)).toBe(IMPORT_STALLED_REASON);
  });
});
