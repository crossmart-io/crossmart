import { Injectable } from '@nestjs/common';
import type { ChannelType } from '@crossmart/connectors';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import { SandboxRestriction } from '../../entitlements/enums/sandbox-restriction.enum.js';
import { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import {
  type AccountRef,
  ChannelConnectionRepository,
} from '../repositories/channel-connection.repository.js';

/**
 * Keeps connected channels within the plan's `Feature.ChannelConnections` limit. Connecting an
 * account the workspace already holds (a re-auth) takes no new slot, so it is never refused.
 * An unclaimed sandbox account connects nothing (ADR 0019).
 */
@Injectable()
export class ChannelConnectionQuota {
  constructor(
    private readonly connections: ChannelConnectionRepository,
    private readonly entitlements: EntitlementService,
  ) {}

  /**
   * Before the merchant is sent to the channel. The account id is not known yet (an eBay
   * account is named after the user who signs in), so any connection the merchant may be
   * repairing counts as a reconnect; the callback checks the exact account.
   */
  async assertCanStart(workspaceId: string, channel: ChannelType, handle: string): Promise<void> {
    await this.assertNotSandbox(workspaceId);
    if (!this.entitlements.enforced) return;
    if (await this.connections.hasReconnectCandidate(workspaceId, channel, handle)) return;
    await this.entitlements.assertInWorkspace(workspaceId, Feature.ChannelConnections);
  }

  /** Before an authorized account is stored. */
  async assertCanConnect(workspaceId: string, account: AccountRef): Promise<void> {
    await this.assertNotSandbox(workspaceId);
    if (!this.entitlements.enforced) return;
    if (await this.connections.holdsSlot(workspaceId, account)) return;
    await this.entitlements.assertInWorkspace(workspaceId, Feature.ChannelConnections);
  }

  private assertNotSandbox(workspaceId: string): Promise<void> {
    return this.entitlements.assertSandboxAllows(workspaceId, SandboxRestriction.ConnectChannel);
  }
}
