import type { AppConfigService } from '@crossmart/common';
import { ActivityActorType, ActivityOutcome } from '@crossmart/database';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { WebhookEmailsService } from '../../notifications/services/webhook-emails.service.js';
import type {
  WebhookAudience,
  WebhookRecipientRepository,
} from '../repositories/webhook-recipient.repository.js';
import {
  TEST_ENDPOINT_ID,
  TEST_ENDPOINT_URL,
  TEST_WORKSPACE_ID,
} from '../testing/webhook-fixtures.js';
import { type DisabledEndpoint, WebhookEndpointNotifier } from './webhook-endpoint.notifier.js';

const WEB_APP_URL = 'https://app.crossmart.test';
const DISABLED: DisabledEndpoint = {
  id: TEST_ENDPOINT_ID,
  workspaceId: TEST_WORKSPACE_ID,
  url: TEST_ENDPOINT_URL,
  failures: 30,
};

function createNotifier(audience: WebhookAudience | null) {
  const activity = new InMemoryActivityRecorder();
  const findAudience = vi
    .fn<WebhookRecipientRepository['findAudience']>()
    .mockResolvedValue(audience);
  const sendEndpointDisabled = vi.fn<WebhookEmailsService['sendEndpointDisabled']>();
  const notifier = new WebhookEndpointNotifier(
    activity,
    { findAudience } as unknown as WebhookRecipientRepository,
    { sendEndpointDisabled } as unknown as WebhookEmailsService,
    { webAppUrl: WEB_APP_URL } as unknown as AppConfigService,
  );
  return { notifier, activity, findAudience, sendEndpointDisabled };
}

describe('WebhookEndpointNotifier.endpointDisabled', () => {
  it('records a failed activity by the system', async () => {
    const { notifier, activity } = createNotifier(null);

    await notifier.endpointDisabled(DISABLED);

    const [recorded] = activity.recorded;
    expect(recorded?.workspaceId).toBe(TEST_WORKSPACE_ID);
    expect(recorded?.actor.type).toBe(ActivityActorType.SYSTEM);
    expect(recorded?.entry).toMatchObject({
      action: ActivityAction.WebhookEndpointDisabled,
      outcome: ActivityOutcome.FAILED,
      subject: {
        type: ActivitySubjectType.WebhookEndpoint,
        id: TEST_ENDPOINT_ID,
        label: TEST_ENDPOINT_URL,
      },
      failureReason: '30 delivery attempts failed in a row',
    });
  });

  it('emails every member who manages webhooks, linking to the settings', async () => {
    const { notifier, findAudience, sendEndpointDisabled } = createNotifier({
      workspaceName: 'Mugs & Co',
      emails: ['ana@example.com', 'bo@example.com'],
    });

    await notifier.endpointDisabled(DISABLED);

    expect(findAudience).toHaveBeenCalledWith(TEST_WORKSPACE_ID);
    expect(sendEndpointDisabled.mock.calls.map(([input]) => input.to)).toEqual([
      'ana@example.com',
      'bo@example.com',
    ]);
    expect(sendEndpointDisabled).toHaveBeenCalledWith({
      to: 'ana@example.com',
      workspaceName: 'Mugs & Co',
      endpointUrl: TEST_ENDPOINT_URL,
      failures: 30,
      url: `${WEB_APP_URL}/settings/webhooks`,
    });
  });

  it('sends no email when the workspace is gone', async () => {
    const { notifier, sendEndpointDisabled } = createNotifier(null);

    await notifier.endpointDisabled(DISABLED);

    expect(sendEndpointDisabled).not.toHaveBeenCalled();
  });
});
