import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { hashSecret } from '@crossmart/common';
import { WorkspaceRole } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import type {
  CreatedInvitation,
  PendingInvitation,
  WorkspaceInvitationRepository,
} from '../repositories/workspace-invitation.repository.js';
import { fakeRoleResolver, managerWith } from '../testing/role-fixtures.js';
import { MAX_PENDING_INVITATIONS } from '../tenancy.constants.js';
import type { InvitationMailer } from './invitation-mailer.js';
import { InvitationPolicy } from './invitation-policy.js';
import { InvitationsService } from './invitations.service.js';

const ADMIN = managerWith(WorkspaceRole.ADMIN);
const ACTOR = Actor.user('user-1');
const PENDING: PendingInvitation = {
  id: 'inv-1',
  workspaceId: 'ws-1',
  workspaceName: 'Acme',
  inviterName: 'Ana',
  email: 'bo@example.com',
  role: WorkspaceRole.EDITOR,
  customRole: null,
  expiresAt: new Date('2026-11-11T00:00:00Z'),
};

function createService() {
  const invitations = {
    replacePending: vi.fn(
      (record: { email: string; role: WorkspaceRole }): Promise<CreatedInvitation> =>
        Promise.resolve({
          id: 'inv-1',
          email: record.email,
          role: record.role,
          customRole: null,
          invitedByName: 'Ana',
          workspaceName: 'Acme',
          expiresAt: new Date(),
          createdAt: new Date(),
        }),
    ),
    countPending: vi.fn().mockResolvedValue(0),
    listPending: vi.fn(),
    revoke: vi.fn(),
    findPendingByTokenHash: vi.fn().mockResolvedValue(PENDING),
    accept: vi.fn().mockResolvedValue(true),
    hasMember: vi.fn().mockResolvedValue(false),
    hasOrganizationMember: vi.fn().mockResolvedValue(false),
  };
  const entitlements = { assertInWorkspace: vi.fn().mockResolvedValue(undefined) };
  const mailer = { send: vi.fn() };
  const activity = new InMemoryActivityRecorder();
  const repository = invitations as unknown as WorkspaceInvitationRepository;
  const policy = new InvitationPolicy(
    repository,
    fakeRoleResolver(),
    entitlements as unknown as EntitlementService,
  );
  const service = new InvitationsService(
    repository,
    policy,
    mailer as unknown as InvitationMailer,
    activity,
  );
  return { service, invitations, mailer, activity, entitlements };
}

describe('InvitationsService.invite', () => {
  it('stores only the token hash and emails the token', async () => {
    const { service, invitations, mailer, activity } = createService();

    const invitation = await service.invite(
      'ws-1',
      ADMIN,
      { email: ' Bo@Example.com ', role: WorkspaceRole.EDITOR },
      ACTOR,
    );

    const [record] = invitations.replacePending.mock.calls[0] ?? [];
    const [, token] = mailer.send.mock.calls[0] as [CreatedInvitation, string];
    expect(record).toMatchObject({ email: 'bo@example.com', tokenHash: hashSecret(token) });
    expect(JSON.stringify(record)).not.toContain(token);
    expect(invitation).not.toHaveProperty('workspaceName');
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.MemberInvited,
      detail: 'as Editor',
    });
  });

  it('never grants more than the inviter has', async () => {
    const { service } = createService();
    await expect(
      service.invite('ws-1', ADMIN, { email: 'bo@example.com', role: WorkspaceRole.OWNER }, ACTOR),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses members and too many pending invitations', async () => {
    const { service, invitations } = createService();
    const request = { email: 'bo@example.com', role: WorkspaceRole.VIEWER };
    invitations.hasMember.mockResolvedValueOnce(true);
    await expect(service.invite('ws-1', ADMIN, request, ACTOR)).rejects.toBeInstanceOf(
      ConflictException,
    );
    invitations.countPending.mockResolvedValueOnce(MAX_PENDING_INVITATIONS);
    await expect(service.invite('ws-1', ADMIN, request, ACTOR)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('InvitationsService.invite and the plan', () => {
  const request = { email: 'bo@example.com', role: WorkspaceRole.VIEWER };

  it('asks the plan for a seat for a newcomer, and sends nothing without one', async () => {
    const { service, invitations, entitlements, mailer } = createService();
    entitlements.assertInWorkspace.mockRejectedValueOnce(planLimitReached(Feature.Members));
    await expect(service.invite('ws-1', ADMIN, request, ACTOR)).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
    });
    expect(entitlements.assertInWorkspace).toHaveBeenCalledWith('ws-1', Feature.Members);
    expect(invitations.replacePending).not.toHaveBeenCalled();
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('needs no new seat for someone already in the organization', async () => {
    const { service, invitations, entitlements } = createService();
    invitations.hasOrganizationMember.mockResolvedValueOnce(true);
    await service.invite('ws-1', ADMIN, request, ACTOR);
    expect(entitlements.assertInWorkspace).not.toHaveBeenCalled();
  });
});

describe('InvitationsService.accept', () => {
  const invitee = { userId: 'user-2', email: 'BO@example.com' };

  it('adds the invitee with the role, whatever the email case', async () => {
    const { service, invitations, activity } = createService();
    const accepted = await service.accept('token', invitee, Actor.user('user-2'));
    expect(invitations.findPendingByTokenHash).toHaveBeenCalledWith(
      hashSecret('token'),
      expect.any(Date),
    );
    expect(accepted).toEqual({ workspaceId: 'ws-1', role: WorkspaceRole.EDITOR });
    expect(activity.entries[0]?.action).toBe(ActivityAction.MemberJoined);
  });

  it('refuses another account', async () => {
    const { service, invitations } = createService();
    await expect(
      service.accept('token', { userId: 'user-3', email: 'eve@example.com' }, ACTOR),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(invitations.accept).not.toHaveBeenCalled();
  });

  it('refuses unknown, used and expired links', async () => {
    const { service, invitations } = createService();
    invitations.findPendingByTokenHash.mockResolvedValueOnce(null);
    await expect(service.preview('nope')).rejects.toBeInstanceOf(NotFoundException);
    invitations.accept.mockResolvedValueOnce(false);
    await expect(service.accept('token', invitee, ACTOR)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('InvitationsService.revoke', () => {
  it('records the revoked address, or says it is not pending', async () => {
    const { service, invitations, activity } = createService();
    invitations.revoke.mockResolvedValueOnce('bo@example.com').mockResolvedValueOnce(null);
    await service.revoke('ws-1', 'inv-1', ACTOR);
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.InvitationRevoked,
      subject: { label: 'bo@example.com' },
    });
    await expect(service.revoke('ws-1', 'inv-1', ACTOR)).rejects.toBeInstanceOf(NotFoundException);
  });
});
