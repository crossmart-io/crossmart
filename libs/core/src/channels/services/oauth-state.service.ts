import { Injectable } from '@nestjs/common';
import type { ChannelType } from '@crossmart/connectors';
import { constantTimeEquals, generateSecureToken, ReplayGuard } from '@crossmart/common';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import { OAUTH_STATE_NONCE_BYTES, OAUTH_STATE_REPLAY_KEY_PREFIX } from '../channels.constants.js';
import type {
  IssuedOAuthState,
  OAuthCallbackBrowser,
  OAuthStateClaims,
  OAuthStatePayload,
} from '../entities/oauth-state.js';
import { ConnectFailure } from '../enums/connect-failure.enum.js';
import { ChannelConnectError } from '../errors/channel-connect.error.js';
import { ChannelConnectionQuota } from './channel-connection.quota.js';
import { OAuthStateSigner } from './oauth-state.signer.js';

/**
 * Issues the OAuth state, while the plan has room for the connection, and checks it on the way
 * back: ours, unexpired, for this channel, used once, by the same browser (its nonce cookie)
 * and the same signed-in user who started it, and for someone who may still manage the
 * workspace. Without the browser binding, an attacker could start a connection and send the
 * channel's approval link to a victim, whose account would land in the attacker's workspace.
 */
@Injectable()
export class OAuthStateService {
  constructor(
    private readonly signer: OAuthStateSigner,
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly quota: ChannelConnectionQuota,
    private readonly replays: ReplayGuard,
  ) {}

  /** Throws `EntitlementExceededException` (HTTP 402) when the plan has no room. */
  async issue(claims: OAuthStateClaims): Promise<IssuedOAuthState> {
    await this.quota.assertCanStart(claims.workspaceId, claims.channel, claims.accountHandle);
    const nonce = generateSecureToken(OAUTH_STATE_NONCE_BYTES);
    return {
      state: this.signer.sign(claims, new Date(), nonce),
      nonce,
      codeVerifier: this.signer.codeVerifier(nonce),
    };
  }

  /** The PKCE verifier of a verified state: the one its authorize URL was built with. */
  codeVerifierOf(payload: OAuthStatePayload): string {
    return this.signer.codeVerifier(payload.nonce);
  }

  /** The state's claims; throws `ChannelConnectError` and consumes the state once it passes. */
  async verify(
    channel: ChannelType,
    state: string | undefined,
    browser: OAuthCallbackBrowser,
  ): Promise<OAuthStatePayload> {
    const payload = this.signer.verify(state);
    this.assertSameBrowser(channel, payload, browser);
    await this.consume(payload);
    return payload;
  }

  async assertCanManage(payload: OAuthStatePayload): Promise<void> {
    const access = await this.workspaceAccess.findRole(payload.workspaceId, payload.userId);
    if (!access?.permissions.has(WorkspacePermission.ManageChannels)) {
      throw new ChannelConnectError(ConnectFailure.NotPermitted);
    }
  }

  private assertSameBrowser(
    channel: ChannelType,
    payload: OAuthStatePayload,
    { sessionUserId, nonce }: OAuthCallbackBrowser,
  ): void {
    if (sessionUserId === null) {
      throw new ChannelConnectError(ConnectFailure.SessionRequired);
    }
    const sameBrowser = nonce !== null && constantTimeEquals(nonce, payload.nonce);
    if (payload.channel !== channel || sessionUserId !== payload.userId || !sameBrowser) {
      throw new ChannelConnectError(ConnectFailure.InvalidState);
    }
  }

  /** A state is good for one callback: a second use of the same nonce is a replay. */
  private async consume(payload: OAuthStatePayload): Promise<void> {
    const key = `${OAUTH_STATE_REPLAY_KEY_PREFIX}${payload.nonce}`;
    const firstUse = await this.replays.claim(key, payload.expiresAt - Date.now());
    if (!firstUse) {
      throw new ChannelConnectError(ConnectFailure.InvalidState);
    }
  }
}
