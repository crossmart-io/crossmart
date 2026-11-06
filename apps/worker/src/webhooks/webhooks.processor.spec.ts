import type { Job } from 'bullmq';
import {
  type WebhookDeliveryRunner,
  type WebhookDispatcher,
  WebhookJobName,
  type WebhookRetentionService,
} from '@crossmart/core';
import { WebhooksProcessor } from './webhooks.processor.js';

function setup() {
  const dispatcher = { dispatch: vi.fn<WebhookDispatcher['dispatch']>(() => Promise.resolve(0)) };
  const runner = { deliver: vi.fn<WebhookDeliveryRunner['deliver']>(() => Promise.resolve()) };
  const retention = { purge: vi.fn<WebhookRetentionService['purge']>(() => Promise.resolve(3)) };
  const processor = new WebhooksProcessor(
    dispatcher as unknown as WebhookDispatcher,
    runner as unknown as WebhookDeliveryRunner,
    retention as unknown as WebhookRetentionService,
  );
  return { dispatcher, runner, retention, processor };
}

describe('WebhooksProcessor', () => {
  it('sends the delivery a deliver job names', async () => {
    const { runner, processor } = setup();
    const ref = { deliveryId: 'd-1', attempts: 2 };
    await processor.process({ name: WebhookJobName.Deliver, data: ref } as Job);
    expect(runner.deliver).toHaveBeenCalledWith(ref);
  });

  it('dispatches due deliveries and cleans up old events', async () => {
    const { dispatcher, retention, processor } = setup();
    await processor.process({ name: WebhookJobName.Dispatch, data: {} } as Job);
    await processor.process({ name: WebhookJobName.CleanUp, data: {} } as Job);
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(retention.purge).toHaveBeenCalledTimes(1);
  });

  it('skips jobs it does not know', async () => {
    const { dispatcher, runner, retention, processor } = setup();
    await processor.process({ name: 'something-else', data: {} } as Job);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
    expect(runner.deliver).not.toHaveBeenCalled();
    expect(retention.purge).not.toHaveBeenCalled();
  });
});
