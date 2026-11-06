import type { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import {
  MS_PER_DAY,
  WEBHOOK_RETENTION_BATCH_SIZE,
  WEBHOOK_RETENTION_DAYS,
} from '../webhooks.constants.js';
import { WebhookRetentionService } from './webhook-retention.service.js';

const NOW = new Date('2026-11-01T12:00:00Z');

function createService(batches: number[]) {
  const deleteEventsBefore = vi.fn<WebhookDeliveryRepository['deleteEventsBefore']>();
  for (const batch of batches) deleteEventsBefore.mockResolvedValueOnce(batch);
  const service = new WebhookRetentionService({
    deleteEventsBefore,
  } as unknown as WebhookDeliveryRepository);
  return { service, deleteEventsBefore };
}

describe('WebhookRetentionService.purge', () => {
  it('deletes events older than the retention period in batches until a short one', async () => {
    const { service, deleteEventsBefore } = createService([
      WEBHOOK_RETENTION_BATCH_SIZE,
      WEBHOOK_RETENTION_BATCH_SIZE,
      12,
    ]);

    const deleted = await service.purge(NOW);

    expect(deleted).toBe(2 * WEBHOOK_RETENTION_BATCH_SIZE + 12);
    expect(deleteEventsBefore).toHaveBeenCalledTimes(3);
    const cutoff = new Date(NOW.getTime() - WEBHOOK_RETENTION_DAYS * MS_PER_DAY);
    expect(deleteEventsBefore).toHaveBeenCalledWith(cutoff, WEBHOOK_RETENTION_BATCH_SIZE);
  });

  it('runs a single statement when nothing is old enough', async () => {
    const { service, deleteEventsBefore } = createService([0]);

    expect(await service.purge(NOW)).toBe(0);
    expect(deleteEventsBefore).toHaveBeenCalledTimes(1);
  });
});
