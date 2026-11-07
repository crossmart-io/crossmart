import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { AskWorkspaceAccess } from '../entities/ask-caller.js';
import { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { FakeAccountLookup } from '../testing/fake-account-lookup.js';
import { AccountLookupsService } from './account-lookups.service.js';

const CATALOG_READER: AskWorkspaceAccess = {
  workspaceId: 'workspace-mine',
  permissions: new Set([WorkspacePermission.ViewProducts, WorkspacePermission.ViewChannels]),
};

function setup() {
  const listingStatus = new FakeAccountLookup(AccountLookupKind.ListingStatus, [
    WorkspacePermission.ViewProducts,
    WorkspacePermission.ViewChannels,
  ]);
  const planUsage = new FakeAccountLookup(AccountLookupKind.PlanUsage, [
    WorkspacePermission.ViewBilling,
  ]);
  return {
    service: new AccountLookupsService([listingStatus, planUsage]),
    listingStatus,
    planUsage,
  };
}

describe('AccountLookupsService', () => {
  it('offers only the lookups the caller’s permissions allow', () => {
    expect(setup().service.allowed(CATALOG_READER)).toEqual([AccountLookupKind.ListingStatus]);
  });

  it('runs a lookup in the caller’s own workspace', async () => {
    const { service, listingStatus } = setup();

    await service.run(CATALOG_READER, [{ kind: AccountLookupKind.ListingStatus, query: 'MUG-1' }]);

    expect(listingStatus.calls).toEqual([{ workspaceId: 'workspace-mine', query: 'MUG-1' }]);
  });

  it('skips a lookup the caller may not run, even when asked for', async () => {
    const { service, planUsage } = setup();

    const facts = await service.run(CATALOG_READER, [
      { kind: AccountLookupKind.PlanUsage, query: null },
    ]);

    expect(facts).toEqual([]);
    expect(planUsage.calls).toEqual([]);
  });
});
