import { Injectable } from '@nestjs/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import type {
  ContentGenerationReceipt,
  ContentGenerationRequest,
} from '../entities/content-generation.js';
import { ContentGenerationQueue } from '../queue/content-generation.queue.js';
import { ContentRequestValidator } from './content-request.validator.js';
import { connectionSubject } from '../../channels/rules/connection-subject.js';

/**
 * Asks the Content Generator for channel content. The work runs in the worker, one job per
 * product, queued in one batch; its results arrive as pending suggestions.
 */
@Injectable()
export class ContentGenerationService {
  constructor(
    private readonly ai: AiGateway,
    private readonly validator: ContentRequestValidator,
    private readonly queue: ContentGenerationQueue,
    private readonly activity: ActivityRecorder,
  ) {}

  async request(
    request: ContentGenerationRequest,
    actor: Actor,
  ): Promise<ContentGenerationReceipt> {
    this.ai.assertConfigured();
    const { store, products } = await this.validator.validate(request);
    const { workspaceId, connectionId } = request;
    await this.queue.enqueue(
      products.map((product) => ({
        workspaceId,
        connectionId,
        productId: product.id,
        requestedBy: actor.toRef(),
      })),
    );
    await this.activity.record(workspaceId, actor, {
      action: ActivityAction.ContentGenerationRequested,
      subject: connectionSubject(store),
      relatedSubjectIds: products.map((product) => product.id),
      itemCount: products.length,
      detail: store.displayName,
    });
    return { queued: products.length };
  }
}
