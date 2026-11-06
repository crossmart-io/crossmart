import type { UploadCleanupReport, UploadCleanupService } from '@crossmart/core';
import { UploadCleanupProcessor } from './upload-cleanup.processor.js';

describe('UploadCleanupProcessor', () => {
  it('runs one cleanup and returns its counts', async () => {
    const report: UploadCleanupReport = { reclaimed: 1, orphaned: 2, deleted: 3, failed: 0 };
    const cleanup = { cleanUp: vi.fn<UploadCleanupService['cleanUp']>().mockResolvedValue(report) };
    const processor = new UploadCleanupProcessor(cleanup as unknown as UploadCleanupService);

    expect(await processor.process()).toEqual(report);
    expect(cleanup.cleanUp).toHaveBeenCalledTimes(1);
  });
});
