import { Injectable } from '@nestjs/common';
import {
  type Prisma,
  PrismaService,
  WebhookDisabledReason,
  WebhookDeliveryStatus,
  type WebhookEndpoint,
} from '@crossmart/database';
import type { WebhookEndpointLastDelivery } from '../entities/webhook-endpoint-view.js';
import { WEBHOOK_ENDPOINT_DISABLED_ERROR } from '../webhooks.constants.js';

type Transaction = Prisma.TransactionClient;

/** An endpoint's failure count after one more failed attempt, and whether it is still enabled. */
export interface EndpointFailureCount {
  consecutiveFailures: number;
  enabled: boolean;
}

/** An endpoint being turned off, why and when. */
interface Disabling {
  workspaceId: string;
  endpointId: string;
  reason: WebhookDisabledReason;
  at: Date;
}

const PENDING_STATUSES = [WebhookDeliveryStatus.PENDING, WebhookDeliveryStatus.RETRYING];

/** Webhook endpoints. Every query a workspace makes is scoped to it. */
@Injectable()
export class WebhookEndpointRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.WebhookEndpointUncheckedCreateInput): Promise<WebhookEndpoint> {
    return this.prisma.webhookEndpoint.create({ data });
  }

  list(workspaceId: string): Promise<WebhookEndpoint[]> {
    return this.prisma.webhookEndpoint.findMany({
      where: { workspaceId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  find(workspaceId: string, endpointId: string): Promise<WebhookEndpoint | null> {
    return this.prisma.webhookEndpoint.findFirst({ where: { id: endpointId, workspaceId } });
  }

  /** Returns the updated endpoint, or null when it is not in the workspace. */
  async update(
    workspaceId: string,
    endpointId: string,
    data: Prisma.WebhookEndpointUpdateManyMutationInput,
  ): Promise<WebhookEndpoint | null> {
    const { count } = await this.prisma.webhookEndpoint.updateMany({
      where: { id: endpointId, workspaceId },
      data,
    });
    return count > 0 ? this.find(workspaceId, endpointId) : null;
  }

  /** Deletes the endpoint with its deliveries; false when it is not in the workspace. */
  async delete(workspaceId: string, endpointId: string): Promise<boolean> {
    const { count } = await this.prisma.webhookEndpoint.deleteMany({
      where: { id: endpointId, workspaceId },
    });
    return count > 0;
  }

  /**
   * Turns the endpoint off and fails what it still had to receive, at once. False when it was
   * already off (or is gone), so only one caller reports it.
   */
  disable(
    workspaceId: string,
    endpointId: string,
    reason: WebhookDisabledReason,
    at: Date,
  ): Promise<boolean> {
    return this.prisma.$transaction((tx) =>
      this.disableIn(tx, { workspaceId, endpointId, reason, at }),
    );
  }

  /** Applies the changes and turns the endpoint off by hand, in one transaction. */
  updateAndTurnOff(
    workspaceId: string,
    endpointId: string,
    data: Prisma.WebhookEndpointUpdateManyMutationInput,
    at: Date,
  ): Promise<WebhookEndpoint | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.webhookEndpoint.updateMany({ where: { id: endpointId, workspaceId }, data });
      const reason = WebhookDisabledReason.MANUAL;
      await this.disableIn(tx, { workspaceId, endpointId, reason, at });
      return tx.webhookEndpoint.findFirst({ where: { id: endpointId, workspaceId } });
    });
  }

  /** A delivery went through: the endpoint is healthy again. */
  async resetFailures(endpointId: string): Promise<void> {
    await this.prisma.webhookEndpoint.updateMany({
      where: { id: endpointId, consecutiveFailures: { gt: 0 } },
      data: { consecutiveFailures: 0 },
    });
  }

  /**
   * Keeps the endpoint's latest attempt, unless a later one is already stored: deliveries run
   * concurrently and may finish out of order.
   */
  async recordLastAttempt(endpointId: string, attempt: WebhookEndpointLastDelivery): Promise<void> {
    await this.prisma.webhookEndpoint.updateMany({
      where: {
        id: endpointId,
        OR: [{ lastAttemptAt: null }, { lastAttemptAt: { lte: attempt.attemptedAt } }],
      },
      data: {
        lastAttemptAt: attempt.attemptedAt,
        lastAttemptOutcome: attempt.outcome,
        lastResponseStatus: attempt.responseStatus,
        lastAttemptError: attempt.error,
      },
    });
  }

  /** Counts one more failed attempt, atomically. Null when the endpoint is gone. */
  async addFailure(endpointId: string): Promise<EndpointFailureCount | null> {
    const rows = await this.prisma.$queryRaw<
      { consecutive_failures: number; disabled_reason: string | null }[]
    >`
      UPDATE webhook_endpoints
      SET consecutive_failures = consecutive_failures + 1, updated_at = now()
      WHERE id = ${endpointId}::uuid
      RETURNING consecutive_failures, disabled_reason`;
    const [row] = rows;
    return row
      ? { consecutiveFailures: row.consecutive_failures, enabled: row.disabled_reason === null }
      : null;
  }

  private async disableIn(tx: Transaction, disabling: Disabling): Promise<boolean> {
    const { workspaceId, endpointId, reason, at } = disabling;
    const { count } = await tx.webhookEndpoint.updateMany({
      where: { id: endpointId, workspaceId, disabledReason: null },
      data: { disabledReason: reason, disabledAt: at },
    });
    if (count === 0) return false;
    await this.cancelPending(tx, endpointId, at);
    return true;
  }

  private async cancelPending(tx: Transaction, endpointId: string, at: Date): Promise<void> {
    await tx.webhookDelivery.updateMany({
      where: { endpointId, status: { in: PENDING_STATUSES } },
      data: {
        status: WebhookDeliveryStatus.FAILED,
        nextAttemptAt: null,
        leaseExpiresAt: null,
        error: WEBHOOK_ENDPOINT_DISABLED_ERROR,
        updatedAt: at,
      },
    });
  }
}
