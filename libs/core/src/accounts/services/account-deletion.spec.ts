import { BadRequestException, ConflictException } from '@nestjs/common';
import { Actor } from '../../activity/entities/actor.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { AccountRepository } from '../repositories/account.repository.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { WorkspaceDeletionService } from './workspace-deletion.service.js';

function setup() {
  const accounts = {
    findWorkspace: vi
      .fn<AccountRepository['findWorkspace']>()
      .mockResolvedValue({ id: 'ws-1', name: 'Shop' }),
    connectedIds: vi.fn<AccountRepository['connectedIds']>().mockResolvedValue(['c-1', 'c-2']),
    deleteWorkspace: vi.fn<AccountRepository['deleteWorkspace']>().mockResolvedValue(),
    workspacesOf: vi.fn<AccountRepository['workspacesOf']>().mockResolvedValue([]),
    deleteUser: vi.fn<AccountRepository['deleteUser']>().mockResolvedValue(),
  };
  const connections = {
    disconnect: vi.fn<ChannelConnectionsService['disconnect']>(),
  };
  const workspaces = new WorkspaceDeletionService(
    accounts as unknown as AccountRepository,
    connections as unknown as ChannelConnectionsService,
  );
  const users = new AccountDeletionService(accounts as unknown as AccountRepository, workspaces);
  return { accounts, connections, workspaces, users };
}

describe('WorkspaceDeletionService', () => {
  it('disconnects every store before deleting the workspace', async () => {
    const { workspaces, accounts, connections } = setup();

    await workspaces.deleteConfirmed('ws-1', ' Shop ', Actor.user('u-1'));

    expect(connections.disconnect.mock.calls.map(([, id]) => id)).toEqual(['c-1', 'c-2']);
    expect(accounts.deleteWorkspace).toHaveBeenCalledWith('ws-1');
  });

  it('deletes nothing unless the typed name matches', async () => {
    const { workspaces, accounts } = setup();

    await expect(workspaces.deleteConfirmed('ws-1', 'Shopp', Actor.user('u-1'))).rejects.toThrow(
      BadRequestException,
    );
    expect(accounts.deleteWorkspace).not.toHaveBeenCalled();
  });
});

describe('AccountDeletionService', () => {
  it('deletes the workspaces only the user uses, then the user', async () => {
    const { users, accounts } = setup();
    accounts.workspacesOf.mockResolvedValue([
      { id: 'solo', name: 'Solo', owner: true, otherMembers: 0 },
      { id: 'team', name: 'Team', owner: false, otherMembers: 3 },
    ]);
    accounts.connectedIds.mockResolvedValue([]);

    await users.delete('u-1');

    expect(accounts.deleteWorkspace.mock.calls).toEqual([['solo']]);
    expect(accounts.deleteUser).toHaveBeenCalledWith('u-1');
  });

  it('refuses while the user owns a workspace others use', async () => {
    const { users, accounts } = setup();
    accounts.workspacesOf.mockResolvedValue([
      { id: 'team', name: 'Team', owner: true, otherMembers: 1 },
    ]);

    await expect(users.delete('u-1')).rejects.toThrow(ConflictException);
    expect(accounts.deleteUser).not.toHaveBeenCalled();
  });
});
