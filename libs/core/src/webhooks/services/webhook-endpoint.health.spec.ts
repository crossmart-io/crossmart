import { WebhookDisabledReason } from '@crossmart/database';
import type {
  EndpointFailureCount,
  WebhookEndpointRepository,
} from '../repositories/webhook-endpoint.repository.js';
import {
  deliveryToSend,
  TEST_ENDPOINT_ID,
  TEST_ENDPOINT_URL,
  TEST_WORKSPACE_ID,
} from '../testing/webhook-fixtures.js';
import { WEBHOOK_DISABLE_AFTER_CONSECUTIVE_FAILURES } from '../webhooks.constants.js';
import { WebhookEndpointHealth } from './webhook-endpoint.health.js';
import type { WebhookEndpointNotifier } from './webhook-endpoint.notifier.js';

const ENDPOINT = deliveryToSend().endpoint;
const LIMIT = WEBHOOK_DISABLE_AFTER_CONSECUTIVE_FAILURES;

function createHealth(count: EndpointFailureCount | null) {
  const addFailure = vi.fn<WebhookEndpointRepository['addFailure']>().mockResolvedValue(count);
  const disable = vi.fn<WebhookEndpointRepository['disable']>().mockResolvedValue(true);
  const endpointDisabled = vi.fn<WebhookEndpointNotifier['endpointDisabled']>().mockResolvedValue();
  const health = new WebhookEndpointHealth(
    { addFailure, disable } as unknown as WebhookEndpointRepository,
    { endpointDisabled } as unknown as WebhookEndpointNotifier,
  );
  return { health, addFailure, disable, endpointDisabled };
}

describe('WebhookEndpointHealth.recordFailure', () => {
  it('only counts the failure while the endpoint is below the limit', async () => {
    const { health, addFailure, disable, endpointDisabled } = createHealth({
      consecutiveFailures: LIMIT - 1,
      enabled: true,
    });

    await health.recordFailure(ENDPOINT);

    expect(addFailure).toHaveBeenCalledWith(TEST_ENDPOINT_ID);
    expect(disable).not.toHaveBeenCalled();
    expect(endpointDisabled).not.toHaveBeenCalled();
  });

  it('turns the endpoint off at the limit and tells the workspace', async () => {
    const { health, disable, endpointDisabled } = createHealth({
      consecutiveFailures: LIMIT,
      enabled: true,
    });

    await health.recordFailure(ENDPOINT);

    expect(disable).toHaveBeenCalledWith(
      TEST_WORKSPACE_ID,
      TEST_ENDPOINT_ID,
      WebhookDisabledReason.FAILING,
      expect.any(Date),
    );
    expect(endpointDisabled).toHaveBeenCalledExactlyOnceWith({
      id: TEST_ENDPOINT_ID,
      workspaceId: TEST_WORKSPACE_ID,
      url: TEST_ENDPOINT_URL,
      failures: LIMIT,
    });
  });

  it('does nothing more for an endpoint already off or gone', async () => {
    for (const count of [{ consecutiveFailures: LIMIT + 5, enabled: false }, null]) {
      const { health, disable, endpointDisabled } = createHealth(count);

      await health.recordFailure(ENDPOINT);

      expect(disable).not.toHaveBeenCalled();
      expect(endpointDisabled).not.toHaveBeenCalled();
    }
  });

  it('sends no notice when another worker turned the endpoint off first', async () => {
    const { health, disable, endpointDisabled } = createHealth({
      consecutiveFailures: LIMIT + 1,
      enabled: true,
    });
    disable.mockResolvedValue(false);

    await health.recordFailure(ENDPOINT);

    expect(disable).toHaveBeenCalledTimes(1);
    expect(endpointDisabled).not.toHaveBeenCalled();
  });
});
