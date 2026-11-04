import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Actor } from '../../activity/entities/actor.js';
import { sharedWorkspacesMessage } from '../accounts.constants.js';
import { AccountRepository } from '../repositories/account.repository.js';
import { WorkspaceDeletionService } from './workspace-deletion.service.js';

/**
 * Closes a user's account. Workspaces only they use are deleted with it; workspaces they share
 * stay with their other members. An owner of a shared workspace is refused, so a team never
 * loses its only owner by surprise.
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly accounts: AccountRepository,
    private readonly workspaces: WorkspaceDeletionService,
  ) {}

  async delete(userId: string): Promise<void> {
    const memberships = await this.accounts.workspacesOf(userId);
    const shared = memberships.filter((workspace) => workspace.owner && workspace.otherMembers > 0);
    if (shared.length > 0) {
      throw new ConflictException(sharedWorkspacesMessage(shared.map(({ name }) => name)));
    }
    const actor = Actor.user(userId);
    for (const workspace of memberships.filter(({ otherMembers }) => otherMembers === 0)) {
      await this.workspaces.delete(workspace.id, actor);
    }
    await this.accounts.deleteUser(userId);
    this.logger.log(`Deleted user ${userId}`);
  }
}
