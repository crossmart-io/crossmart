import type { Queue } from 'bullmq';
import {
  CONTENT_GENERATION_ATTEMPTS,
  CONTENT_GENERATION_JOB_NAME,
} from '../content-generation.constants.js';
import type { ContentGenerationJob } from '../entities/content-generation.js';
import { CONNECTION_ID, CONTENT_JOB, PRODUCT_ID } from '../testing/content-target.fixtures.js';
import { BullContentGenerationQueue } from './bull-content-generation.queue.js';

describe('BullContentGenerationQueue', () => {
  it('adds every job in one batch, deduplicated per product and store, with retries', async () => {
    const addBulk = vi.fn();
    const queue = new BullContentGenerationQueue({
      addBulk,
    } as unknown as Queue<ContentGenerationJob>);

    await queue.enqueue([CONTENT_JOB]);

    expect(addBulk).toHaveBeenCalledWith([
      {
        name: CONTENT_GENERATION_JOB_NAME,
        data: CONTENT_JOB,
        opts: expect.objectContaining({
          deduplication: { id: `content-generation:${CONNECTION_ID}:${PRODUCT_ID}` },
          attempts: CONTENT_GENERATION_ATTEMPTS,
        }),
      },
    ]);
  });

  it('adds nothing for an empty batch', async () => {
    const addBulk = vi.fn();
    await new BullContentGenerationQueue({
      addBulk,
    } as unknown as Queue<ContentGenerationJob>).enqueue([]);
    expect(addBulk).not.toHaveBeenCalled();
  });
});
