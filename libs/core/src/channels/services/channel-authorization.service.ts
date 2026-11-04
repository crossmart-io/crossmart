import { BadRequestException, Injectable } from '@nestjs/common';
import type { ChannelType, OAuthAppConnector } from '@crossmart/connectors';
import { ActivityOutcome } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type {
  AuthorizationRequest,
  ChannelConnectionView,
  StartedAuthorization,
} from '../entities/channel-connection-view.js';
import type { OAuthStatePayload } from '../entities/oauth-state.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import { ChannelConnectError } from '../errors/channel-connect.error.js';
import { ConnectedAccountWriter } from './connected-account.writer.js';
import { OAuthConnectorResolver } from './oauth-connector.resolver.js';
import { OAuthStateService } from './oauth-state.service.js';

const STATE_PARAM = 'state';
const ERROR_PARAM = 'error';

export interface OAuthCallbackInput {
  query: Readonly<Record<string, string>>;
  /** The signed-in user whose browser followed the redirect, when the session cookie came along. */
  sessionUserId: string | null;
}

/**
 * Connects channel accounts through the channel's OAuth app: builds the authorize URL with a
 * signed state, then verifies the callback, stores the credentials sealed and records it.
 */
@Injectable()
export class ChannelAuthorizationService {
  constructor(
    private readonly connectors: OAuthConnectorResolver,
    private readonly states: OAuthStateService,
    private readonly accounts: ConnectedAccountWriter,
    private readonly activity: ActivityRecorder,
  ) {}

  start(workspaceId: string, userId: string, request: AuthorizationRequest): StartedAuthorization {
    const connector = this.connectors.requireReady(request.channel);
    const accountHandle = connector.normalizeAccountHandle(request.accountHandle);
    if (!accountHandle) {
      throw new BadRequestException(`That is not a valid ${connector.displayName} account`);
    }
    const state = this.states.issue({
      workspaceId,
      userId,
      channel: request.channel,
      accountHandle,
    });
    const url = connector.authorizationUrl({
      accountHandle,
      state,
      redirectUri: this.connectors.redirectUri(request.channel),
    });
    return { authorizationUrl: url.toString(), accountHandle, externalAccountId: accountHandle };
  }

  /** Throws `ChannelConnectError`, whose `failure` the API passes back to the web app. */
  async complete(channel: ChannelType, input: OAuthCallbackInput): Promise<ChannelConnectionView> {
    const state = this.states.verify(channel, input.query[STATE_PARAM], input.sessionUserId);
    try {
      await this.states.assertCanManage(state);
      return await this.connect(state, input.query);
    } catch (error) {
      const failure = ChannelConnectError.from(error);
      await this.recordFailure(state, failure);
      throw failure;
    }
  }

  private async connect(
    state: OAuthStatePayload,
    query: Readonly<Record<string, string>>,
  ): Promise<ChannelConnectionView> {
    if (query[ERROR_PARAM]) {
      throw new ChannelConnectError(ConnectFailure.AccessDenied);
    }
    const connector = this.connectors.requireReady(state.channel);
    // The connector checks that the channel answered for the account the merchant named.
    const authorization = await connector.completeAuthorization({
      query,
      redirectUri: this.connectors.redirectUri(state.channel),
      accountHandle: state.accountHandle,
    });
    const view = await this.accounts.save(state, connector, authorization);
    await this.recordConnected(state, connector, view);
    return view;
  }

  private recordConnected(
    state: OAuthStatePayload,
    connector: OAuthAppConnector,
    view: ChannelConnectionView,
  ): Promise<void> {
    return this.activity.record(state.workspaceId, Actor.user(state.userId), {
      action: ActivityAction.ChannelConnected,
      subject: {
        type: ActivitySubjectType.ChannelConnection,
        id: view.id,
        label: view.displayName,
      },
      detail: connector.displayName,
    });
  }

  private recordFailure(state: OAuthStatePayload, failure: ChannelConnectError): Promise<void> {
    return this.activity.record(state.workspaceId, Actor.user(state.userId), {
      action: ActivityAction.ChannelConnectFailed,
      outcome: ActivityOutcome.FAILED,
      subject: { type: ActivitySubjectType.ChannelConnection, label: state.accountHandle },
      detail: this.connectors.displayName(state.channel),
      failureReason: failure.message,
    });
  }
}
