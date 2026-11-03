import type { Queue } from 'bullmq';
import { CHANNEL_IMPORT_ATTEMPTS, CHANNEL_IMPORT_JOB_NAME } from '../channel-import.constants.js';
import type { ChannelImportJobRef } from '../entities/channel-import.js';
import { BullChannelImportQueue } from './bull-channel-import.queue.js';

describe('BullChannelImportQueue', () => {
  it('queues the import under its own id, with retries', async () => {
    const add = vi.fn();
    const queue = new BullChannelImportQueue({ add } as unknown as Queue<ChannelImportJobRef>);

    await queue.enqueue({ workspaceId: 'ws-1', jobId: 'job-1' });

    expect(add).toHaveBeenCalledWith(
      CHANNEL_IMPORT_JOB_NAME,
      { workspaceId: 'ws-1', jobId: 'job-1' },
      expect.objectContaining({ jobId: 'job-1', attempts: CHANNEL_IMPORT_ATTEMPTS }),
    );
  });
});
