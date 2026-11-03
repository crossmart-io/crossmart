import { ImportIssueOutcome } from '@crossmart/database';
import type { ExternalProduct, ExternalVariant } from '@crossmart/connectors';
import type { ImportIssue } from '../../../catalog/entities/catalog-import.js';
import { ImportIssueCode } from '../../../catalog/enums/import-issue-code.enum.js';
import type { OutcomeIssue } from '../../../catalog/repositories/import-job.repository.js';
import { OPTION_VALUE_SEPARATOR } from '../../../inventory/inventory.constants.js';

export function skippedIssue(issue: ImportIssue): OutcomeIssue {
  return { outcome: ImportIssueOutcome.SKIPPED, issue };
}

export function failedIssue(issue: ImportIssue): OutcomeIssue {
  return { outcome: ImportIssueOutcome.FAILED, issue };
}

export function alreadyLinkedIssue(product: ExternalProduct): OutcomeIssue {
  return skippedIssue({
    code: ImportIssueCode.AlreadyLinked,
    message: 'The matching catalog product is already linked to another product of this store',
    handle: product.handle,
  });
}

export function unmatchedVariantIssue(
  product: ExternalProduct,
  variant: ExternalVariant,
): OutcomeIssue {
  const name = variant.sku ?? variant.optionValues.join(OPTION_VALUE_SEPARATOR);
  return skippedIssue({
    code: ImportIssueCode.UnmatchedVariant,
    message: `Variant ${name} matches no variant of the catalog product, so it was not linked`,
    handle: product.handle,
    ...(variant.sku ? { sku: variant.sku } : {}),
  });
}
