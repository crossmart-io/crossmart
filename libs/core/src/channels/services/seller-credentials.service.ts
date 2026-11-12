import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  ChannelError,
  ChannelErrorCode,
  type SellerCredentialsConnector,
} from '@crossmart/connectors';
import { ActivityOutcome } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { CompletedAuthorization } from '../entities/channel-connection-view.js';
import type { SellerCredentialsRequest } from '../entities/seller-credentials-request.js';
import { ChannelConnectError } from '../errors/channel-connect.error.js';
import { SellerCredentialsRejectedException } from '../errors/seller-credentials-rejected.exception.js';
import { parseSellerCredentialValues } from '../rules/seller-credential-values.js';
import { connectionSubject } from '../rules/connection-subject.js';
import { ChannelConnectionQuota } from './channel-connection.quota.js';
import { type ConnectingAccount, ConnectedAccountWriter } from './connected-account.writer.js';
import { SellerCredentialsConnectorResolver } from './seller-credentials-connector.resolver.js';

/** Channel failures that mean the merchant should paste other values, not try again later. */
const OUTAGE_CODES: ReadonlySet<ChannelErrorCode> = new Set([
  ChannelErrorCode.ChannelUnavailable,
  ChannelErrorCode.RateLimited,
]);

/**
 * Connects channels whose sellers paste the keys the channel issued them (Falabella; later
 * Mirakl and Coupang). The values are checked against the connector's fields, verified with a
 * live call, then sealed with the workspace's data key. They are never logged, stored in
 * settings, or returned; failures carry the channel's explanation only.
 */
@Injectable()
export class SellerCredentialsService {
  constructor(
    private readonly connectors: SellerCredentialsConnectorResolver,
    private readonly quota: ChannelConnectionQuota,
    private readonly accounts: ConnectedAccountWriter,
    private readonly activity: ActivityRecorder,
  ) {}

  /**
   * Stores the account, or the new keys of an account connected before. Throws 400 for values
   * the connector does not accept, 422 when the channel refuses them, 503 when it is down, 402
   * when the plan has no room.
   */
  async connect(
    workspaceId: string,
    userId: string,
    request: SellerCredentialsRequest,
  ): Promise<CompletedAuthorization> {
    const connector = this.connectors.requireReady(request.channel);
    const values = parseSellerCredentialValues(connector.credentialFields, request.credentials);
    await this.quota.assertNotSandbox(workspaceId);
    const connecting = { workspaceId, userId, channel: request.channel };
    try {
      const verified = await connector.verifyCredentials(values);
      const completed = await this.accounts.saveVerified(connecting, connector, verified);
      await this.recordConnected(connecting, connector, completed);
      return completed;
    } catch (error) {
      await this.recordFailure(connecting, connector, error);
      throw toHttpError(error);
    }
  }

  private recordConnected(
    connecting: ConnectingAccount,
    connector: SellerCredentialsConnector,
    { connection }: CompletedAuthorization,
  ): Promise<void> {
    return this.activity.record(connecting.workspaceId, Actor.user(connecting.userId), {
      action: ActivityAction.ChannelConnected,
      subject: connectionSubject(connection),
      detail: connector.displayName,
    });
  }

  private recordFailure(
    connecting: ConnectingAccount,
    connector: SellerCredentialsConnector,
    error: unknown,
  ): Promise<void> {
    return this.activity.record(connecting.workspaceId, Actor.user(connecting.userId), {
      action: ActivityAction.ChannelConnectFailed,
      outcome: ActivityOutcome.FAILED,
      subject: { type: ActivitySubjectType.ChannelConnection, label: connector.displayName },
      detail: connector.displayName,
      failureReason: ChannelConnectError.from(error).message,
    });
  }
}

/** A channel's refusal as HTTP: 503 for outages, 422 for the rest; other errors pass through. */
function toHttpError(error: unknown): unknown {
  if (!(error instanceof ChannelError)) return error;
  if (OUTAGE_CODES.has(error.code)) return new ServiceUnavailableException(error.message);
  return new SellerCredentialsRejectedException(
    ChannelConnectError.from(error).failure,
    error.message,
  );
}
