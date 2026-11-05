import { ActivityActorType } from '@crossmart/database';
import type { Job } from 'bullmq';
import type { ContentGenerationJob, ContentGenerationRunner } from '@crossmart/core';
import { ContentGenerationProcessor } from './content-generation.processor.js';

const DATA: ContentGenerationJob = {
  workspaceId: 'ws-1',
  connectionId: 'conn-1',
  productId: 'prod-1',
  requestedBy: { type: ActivityActorType.USER, userId: 'user-1', apiKeyId: null },
};

function job(attemptsMade: number, attempts?: number): Job<ContentGenerationJob> {
  return { data: DATA, attemptsMade, opts: { attempts } } as Job<ContentGenerationJob>;
}

describe('ContentGenerationProcessor', () => {
  it.each([
    [0, 3, false],
    [2, 3, true],
    [0, undefined, true],
  ])(
    'runs the job, telling it whether attempt %i of %s is the last',
    async (made, attempts, finalAttempt) => {
      const runner = { run: vi.fn<ContentGenerationRunner['run']>(() => Promise.resolve()) };
      const processor = new ContentGenerationProcessor(
        runner as unknown as ContentGenerationRunner,
      );

      await processor.process(job(made, attempts));

      expect(runner.run).toHaveBeenCalledWith(DATA, { finalAttempt });
    },
  );
});
