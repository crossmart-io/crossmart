import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, WebhookEndpoint } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type {
  NewWebhookEndpoint,
  WebhookEndpointChanges,
  WebhookEndpointView,
  WebhookEndpointWithSecret,
} from '../entities/webhook-endpoint-view.js';
import { toWebhookEndpointView } from '../mappers/webhook-view.mapper.js';
import { WebhookEndpointRepository } from '../repositories/webhook-endpoint.repository.js';
import {
  WEBHOOK_ENDPOINT_NOT_FOUND,
  WEBHOOK_SECRET_ROTATION_GRACE_MS,
} from '../webhooks.constants.js';
import { WebhookEndpointAdmission } from './webhook-endpoint.admission.js';
import { WebhookSecretVault } from './webhook-secret.vault.js';

const TURNED_ON = 'turned on';
const TURNED_OFF = 'turned off';

/**
 * A workspace's webhook endpoints: add, change, turn on and off, delete, and rotate secrets.
 * Endpoints count toward the plan's `Feature.WebhookEndpoints` limit, across the organization.
 * Secrets are returned only when made; the activity log names endpoints by URL, never secrets.
 * Rotating again within the grace period ends the older secret's grace at once: only two
 * secrets sign at a time.
 */
@Injectable()
export class WebhookEndpointsService {
  constructor(
    private readonly endpoints: WebhookEndpointRepository,
    private readonly secrets: WebhookSecretVault,
    private readonly admission: WebhookEndpointAdmission,
    private readonly activity: ActivityRecorder,
  ) {}

  async list(workspaceId: string): Promise<WebhookEndpointView[]> {
    const endpoints = await this.endpoints.list(workspaceId);
    return endpoints.map(toWebhookEndpointView);
  }

  async get(workspaceId: string, endpointId: string): Promise<WebhookEndpointView> {
    return toWebhookEndpointView(await this.require(workspaceId, endpointId));
  }

  async create(
    workspaceId: string,
    input: NewWebhookEndpoint,
    actor: Actor,
  ): Promise<WebhookEndpointWithSecret> {
    const url = await this.admission.admit(workspaceId, input.url);
    const endpointId = randomUUID();
    const secret = this.secrets.generate();
    const endpoint = await this.endpoints.create({
      id: endpointId,
      workspaceId,
      url,
      description: input.description ?? null,
      eventTypes: [...new Set(input.eventTypes)],
      sealedSecret: await this.secrets.seal({ workspaceId, endpointId }, secret),
    });
    await this.record(actor, ActivityAction.WebhookEndpointCreated, endpoint);
    return { endpoint: toWebhookEndpointView(endpoint), secret };
  }

  async update(
    workspaceId: string,
    endpointId: string,
    changes: WebhookEndpointChanges,
    actor: Actor,
  ): Promise<WebhookEndpointView> {
    const current = await this.require(workspaceId, endpointId);
    const data = await this.toUpdate(current, changes);
    const turnOff = changes.enabled === false && current.disabledReason === null;
    const updated = turnOff
      ? await this.endpoints.updateAndTurnOff(workspaceId, endpointId, data, new Date())
      : await this.endpoints.update(workspaceId, endpointId, data);
    if (!updated) throw new NotFoundException(WEBHOOK_ENDPOINT_NOT_FOUND);
    await this.record(
      actor,
      ActivityAction.WebhookEndpointUpdated,
      updated,
      toggleOf(current, changes),
    );
    return toWebhookEndpointView(updated);
  }

  async delete(workspaceId: string, endpointId: string, actor: Actor): Promise<void> {
    const endpoint = await this.require(workspaceId, endpointId);
    if (!(await this.endpoints.delete(workspaceId, endpointId))) {
      throw new NotFoundException(WEBHOOK_ENDPOINT_NOT_FOUND);
    }
    await this.record(actor, ActivityAction.WebhookEndpointDeleted, endpoint);
  }

  /**
   * Gives the endpoint a new secret, returned once. For a grace period deliveries are signed
   * with the old secret too, so the receiver can switch without dropping events.
   */
  async rotateSecret(
    workspaceId: string,
    endpointId: string,
    actor: Actor,
  ): Promise<WebhookEndpointWithSecret> {
    const current = await this.require(workspaceId, endpointId);
    const secret = this.secrets.generate();
    const now = Date.now();
    const updated = await this.endpoints.update(workspaceId, endpointId, {
      sealedSecret: await this.secrets.seal({ workspaceId, endpointId }, secret),
      previousSealedSecret: current.sealedSecret,
      previousSecretExpiresAt: new Date(now + WEBHOOK_SECRET_ROTATION_GRACE_MS),
    });
    if (!updated) throw new NotFoundException(WEBHOOK_ENDPOINT_NOT_FOUND);
    await this.record(actor, ActivityAction.WebhookSecretRotated, updated);
    return { endpoint: toWebhookEndpointView(updated), secret };
  }

  private async require(workspaceId: string, endpointId: string): Promise<WebhookEndpoint> {
    const endpoint = await this.endpoints.find(workspaceId, endpointId);
    if (!endpoint) throw new NotFoundException(WEBHOOK_ENDPOINT_NOT_FOUND);
    return endpoint;
  }

  /** The columns a change sets; turning an endpoint on also clears its failures. */
  private async toUpdate(
    current: WebhookEndpoint,
    changes: WebhookEndpointChanges,
  ): Promise<Prisma.WebhookEndpointUpdateManyMutationInput> {
    const reenable = changes.enabled === true && current.disabledReason !== null;
    return {
      ...(changes.url === undefined ? {} : { url: await this.admission.checkUrl(changes.url) }),
      ...(changes.description === undefined ? {} : { description: changes.description }),
      ...(changes.eventTypes ? { eventTypes: [...new Set(changes.eventTypes)] } : {}),
      ...(reenable ? { disabledReason: null, disabledAt: null, consecutiveFailures: 0 } : {}),
    };
  }

  private record(
    actor: Actor,
    action: ActivityAction,
    endpoint: WebhookEndpoint,
    detail?: string,
  ): Promise<void> {
    return this.activity.record(endpoint.workspaceId, actor, {
      action,
      subject: { type: ActivitySubjectType.WebhookEndpoint, id: endpoint.id, label: endpoint.url },
      detail,
    });
  }
}

/** Says when a change turned the endpoint on or off, for the activity log. */
function toggleOf(current: WebhookEndpoint, changes: WebhookEndpointChanges): string | undefined {
  const wasEnabled = current.disabledReason === null;
  if (changes.enabled === undefined || changes.enabled === wasEnabled) return undefined;
  return changes.enabled ? TURNED_ON : TURNED_OFF;
}
