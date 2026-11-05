import { Injectable } from '@nestjs/common';
import type { ChannelType } from '@crossmart/connectors';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import type { OAuthStateClaims, OAuthStatePayload } from '../entities/oauth-state.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import { ChannelConnectError } from '../errors/channel-connect.error.js';
import { ChannelConnectionQuota } from './channel-connection.quota.js';
import { OAuthStateSigner } from './oauth-state.signer.js';

/**
 * Issues the OAuth state, while the plan has room for the connection, and checks it on the way
 * back: ours, unexpired, for this channel, for whoever followed the redirect, and for someone
 * who may still manage the workspace.
 */
@Injectable()
export class OAuthStateService {
  constructor(
    private readonly signer: OAuthStateSigner,
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly quota: ChannelConnectionQuota,
  ) {}

  /** Throws `EntitlementExceededException` (HTTP 402) when the plan has no room. */
  async issue(claims: OAuthStateClaims): Promise<string> {
    await this.quota.assertCanStart(claims.workspaceId, claims.channel, claims.accountHandle);
    return this.signer.sign(claims);
  }

  verify(
    channel: ChannelType,
    state: string | undefined,
    sessionUserId: string | null,
  ): OAuthStatePayload {
    const payload = this.signer.verify(state);
    const otherUser = sessionUserId !== null && sessionUserId !== payload.userId;
    if (payload.channel !== channel || otherUser) {
      throw new ChannelConnectError(ConnectFailure.InvalidState);
    }
    return payload;
  }

  async assertCanManage(payload: OAuthStatePayload): Promise<void> {
    const access = await this.workspaceAccess.findRole(payload.workspaceId, payload.userId);
    if (!access?.permissions.has(WorkspacePermission.ManageChannels)) {
      throw new ChannelConnectError(ConnectFailure.NotPermitted);
    }
  }
}
