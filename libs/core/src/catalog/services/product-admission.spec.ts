import { BadRequestException, ConflictException } from '@nestjs/common';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { noSandboxEntitlements } from '../../entitlements/testing/sandbox-entitlements.js';
import { productDraft } from '../import/strategies/__testing__/product-draft.factory.js';
import { normalizeDraft } from '../rules/normalize-draft.js';
import type { CatalogConflictsService } from './catalog-conflicts.service.js';
import { ProductAdmission } from './product-admission.js';

const NO_CONFLICTS = { accepted: [], existing: [], skuConflicts: [] };

function setup() {
  const conflicts = {
    check: vi.fn<CatalogConflictsService['check']>().mockResolvedValue(NO_CONFLICTS),
  };
  const entitlements = noSandboxEntitlements();
  const admission = new ProductAdmission(
    conflicts as unknown as CatalogConflictsService,
    entitlements as unknown as EntitlementService,
  );
  return { admission, conflicts, entitlements };
}

describe('ProductAdmission', () => {
  it('asks for room for a new product once its handle and SKUs are free', async () => {
    const { admission, conflicts, entitlements } = setup();
    const draft = normalizeDraft(productDraft('mug', 'MUG-1'));

    await admission.assertCreatable('ws-1', draft);

    expect(conflicts.check).toHaveBeenCalledWith('ws-1', [draft], undefined);
    expect(entitlements.assertProductRoom).toHaveBeenCalledWith('ws-1');
  });

  it('needs no room to update a product, and ignores its own handle', async () => {
    const { admission, conflicts, entitlements } = setup();
    const draft = normalizeDraft(productDraft('mug', 'MUG-1'));

    await admission.assertUpdatable('ws-1', 'p-1', draft);

    expect(conflicts.check).toHaveBeenCalledWith('ws-1', [draft], 'p-1');
    expect(entitlements.assertProductRoom).not.toHaveBeenCalled();
  });

  it('refuses an invalid draft or a clash before asking for room', async () => {
    const { admission, conflicts, entitlements } = setup();
    const invalid = normalizeDraft({ ...productDraft('mug', 'MUG-1'), title: ' ' });
    await expect(admission.assertCreatable('ws-1', invalid)).rejects.toThrow(BadRequestException);

    conflicts.check.mockResolvedValueOnce({
      ...NO_CONFLICTS,
      existing: [{ handle: 'mug', message: 'Handle mug is taken' }],
    } as unknown as Awaited<ReturnType<CatalogConflictsService['check']>>);
    const draft = normalizeDraft(productDraft('mug', 'MUG-1'));
    await expect(admission.assertCreatable('ws-1', draft)).rejects.toThrow(ConflictException);
    expect(entitlements.assertProductRoom).not.toHaveBeenCalled();
  });
});
