import { MS_PER_DAY } from '@crossmart/common';
import { ASK_RETENTION_BATCH_SIZE, ASK_RETENTION_DAYS } from '../ask.constants.js';
import type { AskConversationRepository } from '../repositories/ask-conversation.repository.js';
import { AskRetentionService } from './ask-retention.service.js';

describe('AskRetentionService', () => {
  it('deletes conversations idle past the retention period, in batches', async () => {
    const deleteIdleBefore = vi
      .fn()
      .mockResolvedValueOnce(ASK_RETENTION_BATCH_SIZE)
      .mockResolvedValueOnce(3);
    const service = new AskRetentionService({
      deleteIdleBefore,
    } as unknown as AskConversationRepository);
    const now = new Date('2026-11-07T00:00:00Z');

    expect(await service.purge(now)).toBe(ASK_RETENTION_BATCH_SIZE + 3);
    expect(deleteIdleBefore).toHaveBeenCalledTimes(2);
    expect(deleteIdleBefore).toHaveBeenCalledWith(
      new Date(now.getTime() - ASK_RETENTION_DAYS * MS_PER_DAY),
      ASK_RETENTION_BATCH_SIZE,
    );
  });
});
