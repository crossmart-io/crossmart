import type { Job } from 'bullmq';
import {
  type ChannelImportJobRef,
  type ChannelImportRunner,
  IMPORT_SWEEP_JOB_NAME,
  type StalledImportSweeper,
} from '@crossmart/core';
import { ChannelImportProcessor } from './channel-import.processor.js';

const REF = { workspaceId: 'ws-1', jobId: 'job-1' };

function job(attemptsMade: number, attempts?: number): Job<ChannelImportJobRef> {
  return { data: REF, attemptsMade, opts: { attempts } } as Job<ChannelImportJobRef>;
}

function setup() {
  const runner = { run: vi.fn<ChannelImportRunner['run']>(() => Promise.resolve()) };
  const sweeper = { sweep: vi.fn<StalledImportSweeper['sweep']>(() => Promise.resolve(0)) };
  const processor = new ChannelImportProcessor(
    runner as unknown as ChannelImportRunner,
    sweeper as unknown as StalledImportSweeper,
  );
  return { runner, sweeper, processor };
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
      const { runner, processor } = setup();

      await processor.process(job(made, attempts));

      expect(runner.run).toHaveBeenCalledWith(REF, { finalAttempt });
    },
  );

  it('runs the scheduled sweep instead of an import', async () => {
    const { runner, sweeper, processor } = setup();

    await processor.process({
      name: IMPORT_SWEEP_JOB_NAME,
      data: {},
      opts: {},
    } as Job<ChannelImportJobRef>);

    expect(sweeper.sweep).toHaveBeenCalled();
    expect(runner.run).not.toHaveBeenCalled();
  });
});
