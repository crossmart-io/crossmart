import { ProductStatus } from '@crossmart/database/generated/prisma/enums.js';
import { AgentToolName } from '../../agent-tools/agent-tools.constants.js';
import { ALL_TOOLS } from '../../agent-tools/tools/index.js';
import { AgentApprovalExemption } from '../enums/agent-approval-exemption.enum.js';
import { approvalExemptionFor, isNewDraft } from './approval-exemptions.js';

const tool = (name: string) => {
  const spec = ALL_TOOLS.find((candidate) => candidate.name === name);
  if (!spec) throw new Error(name);
  return spec;
};

/**
 * Everything create_product takes. A new field must be checked against the new-draft exemption
 * before it is added here: an input that lists the product on a store, or anything else a buyer
 * sees, must not apply without the seller's approval.
 */
const CREATE_PRODUCT_INPUTS = [
  'condition',
  'descriptionHtml',
  'handle',
  'media',
  'optionNames',
  'productType',
  'status',
  'tags',
  'title',
  'variants',
  'vendor',
];

describe('isNewDraft', () => {
  it('holds for a product without a status, or with DRAFT', () => {
    expect(isNewDraft({ title: 'Jeans' })).toBe(true);
    expect(isNewDraft({ title: 'Jeans', status: ProductStatus.DRAFT })).toBe(true);
  });

  it('does not hold for any other status, null, or something that is not an input', () => {
    expect(isNewDraft({ status: ProductStatus.ACTIVE })).toBe(false);
    expect(isNewDraft({ status: ProductStatus.ARCHIVED })).toBe(false);
    expect(isNewDraft({ status: null })).toBe(false);
    expect(isNewDraft({ status: 'draft' })).toBe(false);
    for (const input of [null, undefined, 'DRAFT', [], 1]) expect(isNewDraft(input)).toBe(false);
  });
});

describe('approvalExemptionFor', () => {
  it('exempts create_product for a new draft only', () => {
    const create = tool(AgentToolName.CreateProduct);
    expect(approvalExemptionFor(create, { title: 'Jeans' })).toBe(AgentApprovalExemption.NewDraft);
    expect(approvalExemptionFor(create, { status: ProductStatus.ACTIVE })).toBeNull();
  });

  it('exempts no other write, whatever its input', () => {
    const others = ALL_TOOLS.filter((spec) => spec.name !== AgentToolName.CreateProduct);
    for (const spec of others) expect(approvalExemptionFor(spec, {})).toBeNull();
  });

  it('keeps create_product free of inputs that would publish the new product', () => {
    expect(Object.keys(tool(AgentToolName.CreateProduct).input).sort()).toEqual(
      CREATE_PRODUCT_INPUTS,
    );
  });
});
