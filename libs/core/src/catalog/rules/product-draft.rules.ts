import { MAX_PRODUCT_OPTIONS, MAX_VARIANTS_PER_PRODUCT } from '../catalog.constants.js';
import type { ProductDraft, VariantDraft } from '../entities/product-draft.js';
import { ImportIssueCode } from '../enums/import-issue-code.enum.js';

export interface DraftProblem {
  code: ImportIssueCode;
  message: string;
}

/** Structural rules every product must meet, however it reaches the catalog. Empty when valid. */
export function findDraftProblems(draft: ProductDraft): DraftProblem[] {
  return [
    ...checkRequiredText(draft),
    ...checkOptionNames(draft.optionNames),
    ...checkVariantCount(draft.variants),
    ...checkVariantOptions(draft),
    ...checkSkusWithinProduct(draft.variants),
  ];
}

function checkRequiredText(draft: ProductDraft): DraftProblem[] {
  const problems: DraftProblem[] = [];
  if (!draft.title.trim()) {
    problems.push({ code: ImportIssueCode.MissingValue, message: 'A product needs a title' });
  }
  if (!draft.handle.trim()) {
    problems.push({ code: ImportIssueCode.MissingValue, message: 'A product needs a handle' });
  }
  return problems;
}

function checkOptionNames(optionNames: string[]): DraftProblem[] {
  if (optionNames.length > MAX_PRODUCT_OPTIONS) {
    return [invalidOptions(`A product can have at most ${MAX_PRODUCT_OPTIONS} options`)];
  }
  const normalized = optionNames.map((name) => name.trim().toLowerCase());
  if (normalized.some((name) => !name)) {
    return [invalidOptions('Option names cannot be empty')];
  }
  if (new Set(normalized).size !== normalized.length) {
    return [invalidOptions('Option names must be unique')];
  }
  return [];
}

function checkVariantCount(variants: VariantDraft[]): DraftProblem[] {
  if (variants.length === 0) {
    return [
      { code: ImportIssueCode.MissingValue, message: 'A product needs at least one variant' },
    ];
  }
  if (variants.length > MAX_VARIANTS_PER_PRODUCT) {
    return [invalidOptions(`A product can have at most ${MAX_VARIANTS_PER_PRODUCT} variants`)];
  }
  return [];
}

function checkVariantOptions({ optionNames, variants }: ProductDraft): DraftProblem[] {
  const hasWrongArity = variants.some(
    (variant) =>
      variant.optionValues.length !== optionNames.length ||
      variant.optionValues.some((value) => !value.trim()),
  );
  if (hasWrongArity) {
    return [
      invalidOptions(`Every variant needs a value for each option (${optionNames.join(', ')})`),
    ];
  }
  const combinations = variants.map((variant) => variant.optionValues.join('\u0000').toLowerCase());
  if (new Set(combinations).size !== combinations.length) {
    return [invalidOptions('Two variants have the same option values')];
  }
  return [];
}

function checkSkusWithinProduct(variants: VariantDraft[]): DraftProblem[] {
  const skus = variants.flatMap((variant) => (variant.sku ? [variant.sku] : []));
  const duplicate = skus.find((sku, index) => skus.indexOf(sku) !== index);
  return duplicate
    ? [{ code: ImportIssueCode.DuplicateSku, message: `SKU ${duplicate} is used twice` }]
    : [];
}

function invalidOptions(message: string): DraftProblem {
  return { code: ImportIssueCode.InvalidOptions, message };
}
