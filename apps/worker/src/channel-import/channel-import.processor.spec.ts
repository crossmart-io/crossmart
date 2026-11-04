import type { Job } from 'bullmq';
import type { ChannelImportJobRef, ChannelImportRunner } from '@crossmart/core';
import { ChannelImportProcessor } from './channel-import.processor.js';

const REF = { workspaceId: 'ws-1', jobId: 'job-1' };

function job(attemptsMade: number, attempts?: number): Job<ChannelImportJobRef> {
  return { data: REF, attemptsMade, opts: { attempts } } as Job<ChannelImportJobRef>;
}

describe('ChannelImportProcessor', () => {
  it.each([
    [0, 5, false],
    [3, 5, false],
    [4, 5, true],
    [0, undefined, true],
  ])(
    'runs the import, telling it whether attempt %i of %s is the last',
    async (made, attempts, finalAttempt) => {
      const runner = { run: vi.fn<ChannelImportRunner['run']>(() => Promise.resolve()) };
      const processor = new ChannelImportProcessor(runner as unknown as ChannelImportRunner);

      await processor.process(job(made, attempts));

      expect(runner.run).toHaveBeenCalledWith(REF, { finalAttempt });
    },
  );
});
