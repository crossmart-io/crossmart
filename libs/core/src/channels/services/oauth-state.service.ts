import { Injectable } from '@nestjs/common';
import type { ChannelType } from '@crossmart/connectors';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { roleHasPermission } from '../../tenancy/permissions/role-permissions.js';
import { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import type { OAuthStateClaims, OAuthStatePayload } from '../entities/oauth-state.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import { ChannelConnectError } from '../errors/channel-connect.error.js';
import { OAuthStateSigner } from './oauth-state.signer.js';

/**
 * Issues the OAuth state and checks it on the way back: ours, unexpired, for this channel,
 * for whoever followed the redirect, and for someone who may still manage the workspace.
 */
@Injectable()
export class OAuthStateService {
  constructor(
    private readonly signer: OAuthStateSigner,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  issue(claims: OAuthStateClaims): string {
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
    const role = await this.workspaceAccess.findRole(payload.workspaceId, payload.userId);
    if (!role || !roleHasPermission(role, WorkspacePermission.ManageWorkspace)) {
      throw new ChannelConnectError(ConnectFailure.NotPermitted);
    }
  }
}
