import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { CONFIRMATION_MISMATCH, WORKSPACE_NOT_FOUND } from '../accounts.constants.js';
import { AccountRepository } from '../repositories/account.repository.js';

/**
 * Closes a workspace for good: each store is disconnected first, which removes Crossmart's app
 * from it unless another workspace still uses that store, then every row the workspace owns
 * is deleted. Nothing is kept, so the privacy policy's deletion promise holds at once.
 */
@Injectable()
export class WorkspaceDeletionService {
  private readonly logger = new Logger(WorkspaceDeletionService.name);

  constructor(
    private readonly accounts: AccountRepository,
    private readonly connections: ChannelConnectionsService,
  ) {}

  /** `confirmName` must match the workspace's name, so a stray request deletes nothing. */
  async deleteConfirmed(workspaceId: string, confirmName: string, actor: Actor): Promise<void> {
    const workspace = await this.accounts.findWorkspace(workspaceId);
    if (!workspace) throw new NotFoundException(WORKSPACE_NOT_FOUND);
    if (workspace.name.trim() !== confirmName.trim()) {
      throw new BadRequestException(CONFIRMATION_MISMATCH);
    }
    await this.delete(workspaceId, actor);
  }

  async delete(workspaceId: string, actor: Actor): Promise<void> {
    for (const connectionId of await this.accounts.connectedIds(workspaceId)) {
      await this.connections.disconnect(workspaceId, connectionId, actor);
    }
    await this.accounts.deleteWorkspace(workspaceId);
    this.logger.log(`Deleted workspace ${workspaceId}`);
  }
}
