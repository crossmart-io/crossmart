import type { OrganizationRepository } from '../repositories/organization.repository.js';
import type { WorkspaceMemberRepository } from '../repositories/workspace-member.repository.js';
import { DEFAULT_WORKSPACE_NAME } from '../tenancy.constants.js';
import { TenancyProvisioningService } from './tenancy-provisioning.service.js';

const NEW_USER = { id: 'user-1', name: 'Dana Seller', email: 'dana@example.com' };

function createService(hasMembership: boolean) {
  const organizations = { createWithOwner: vi.fn().mockResolvedValue({ workspaceId: 'ws-1' }) };
  const members = { userHasAnyMembership: vi.fn().mockResolvedValue(hasMembership) };
  const service = new TenancyProvisioningService(
    organizations as unknown as OrganizationRepository,
    members as unknown as WorkspaceMemberRepository,
  );
  return { service, organizations };
}

describe('TenancyProvisioningService', () => {
  it('creates an organization and a default workspace owned by the new user', async () => {
    const { service, organizations } = createService(false);

    await service.provisionForNewUser(NEW_USER);

    expect(organizations.createWithOwner).toHaveBeenCalledWith({
      organizationName: 'Dana Seller',
      workspaceName: DEFAULT_WORKSPACE_NAME,
      workspaceSlug: 'default',
      ownerId: 'user-1',
    });
  });

  it('falls back to the email when the user has no name', async () => {
    const { service, organizations } = createService(false);

    await service.provisionForNewUser({ ...NEW_USER, name: '  ' });

    expect(organizations.createWithOwner).toHaveBeenCalledWith(
      expect.objectContaining({ organizationName: 'dana@example.com' }),
    );
  });

  it('does nothing for a user who already belongs to a workspace', async () => {
    const { service, organizations } = createService(true);

    await service.provisionForNewUser(NEW_USER);

    expect(organizations.createWithOwner).not.toHaveBeenCalled();
  });
});
