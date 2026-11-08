import { ChannelType } from '@crossmart/connectors';
import { ActivityActorType } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { AiNotConfiguredError } from '../../ai/errors/ai.errors.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import type { AiUsageService } from '../../ai/services/ai-usage.service.js';
import { FakeAiProvider } from '../../ai/testing/fake-ai.provider.js';
import { unlimitedEntitlements } from '../../ai/testing/unlimited-entitlements.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ContentGenerationJob } from '../entities/content-generation.js';
import { ContentGenerationQueue } from '../queue/content-generation.queue.js';
import { CONNECTION_ID, PRODUCT_ID, WORKSPACE_ID } from '../testing/content-target.fixtures.js';
import type { ContentRequestValidator } from './content-request.validator.js';
import { ContentGenerationService } from './content-generation.service.js';

const REQUEST = {
  workspaceId: WORKSPACE_ID,
  connectionId: CONNECTION_ID,
  productIds: [PRODUCT_ID],
};
const ACTOR = Actor.apiKey('key-1');

class RecordingQueue extends ContentGenerationQueue {
  readonly jobs: ContentGenerationJob[] = [];
  enqueue(jobs: readonly ContentGenerationJob[]): Promise<void> {
    this.jobs.push(...jobs);
    return Promise.resolve();
  }
}

function setup(configured = true) {
  const ai = new AiGateway(
    new FakeAiProvider(configured),
    {} as AiUsageService,
    unlimitedEntitlements(),
  );
  const store = { id: CONNECTION_ID, channel: ChannelType.Shopify, displayName: 'Demo Store' };
  const validator = {
    validate: vi.fn<ContentRequestValidator['validate']>().mockResolvedValue({
      store: store as ChannelConnectionView,
      products: [{ id: PRODUCT_ID, title: 'Mug' }],
    }),
  };
  const queue = new RecordingQueue();
  const activity = new InMemoryActivityRecorder();
  const service = new ContentGenerationService(
    ai,
    validator as unknown as ContentRequestValidator,
    queue,
    activity,
  );
  return { service, validator, queue, activity };
}

describe('ContentGenerationService', () => {
  it('queues one job per product for the requester and logs the request', async () => {
    const { service, queue, activity } = setup();

    expect(await service.request(REQUEST, ACTOR)).toEqual({ queued: 1 });
    expect(queue.jobs).toEqual([
      {
        workspaceId: WORKSPACE_ID,
        connectionId: CONNECTION_ID,
        productId: PRODUCT_ID,
        requestedBy: {
          type: ActivityActorType.API_KEY,
          userId: null,
          apiKeyId: 'key-1',
          agentClientId: null,
          agentName: null,
        },
      },
    ]);
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ContentGenerationRequested,
      itemCount: 1,
      relatedSubjectIds: [PRODUCT_ID],
      detail: 'Demo Store',
    });
  });

  it('refuses before validating or queuing anything while AI is not configured', async () => {
    const { service, validator, queue } = setup(false);

    await expect(service.request(REQUEST, ACTOR)).rejects.toThrow(AiNotConfiguredError);
    expect(validator.validate).not.toHaveBeenCalled();
    expect(queue.jobs).toHaveLength(0);
  });
});
