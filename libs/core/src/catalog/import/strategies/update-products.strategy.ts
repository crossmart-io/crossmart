import { Inject, Injectable } from '@nestjs/common';
import { CATALOG_FILE_PARSERS } from '../../catalog.constants.js';
import type {
  CatalogFileParser,
  CatalogImportRequest,
  CatalogParseResult,
  CatalogImportStrategy,
  ImportIssue,
  ImportOutcome,
} from '../../entities/catalog-import.js';
import { ProductPatch } from '../../entities/product-patch.js';
import type { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../../enums/catalog-import-mode.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import { toProductDraft } from '../../mappers/product-draft.mapper.js';
import type { ProductUpdateTargetRecord } from '../../repositories/product.queries.js';
import { ProductUpdateWriter } from '../../repositories/product-update.writer.js';
import { ProductRepository } from '../../repositories/product.repository.js';
import { normalizeDraft } from '../../rules/normalize-draft.js';
import { findDraftProblems } from '../../rules/product-draft.rules.js';
import {
  CatalogConflictsService,
  type ProductReplacement,
} from '../../services/catalog-conflicts.service.js';
import { findParser } from '../find-parser.js';
import { emptyOutcome, withRows } from '../import-issues.js';
import { mergeIntoExisting } from './existing-product-merge.js';

interface MatchedProducts {
  replacements: ProductReplacement[];
  notFound: ImportIssue[];
  /** Products whose merged result is invalid, and variant rows that could not be applied. */
  failed: ImportIssue[];
}

/**
 * Applies the file's changes to the catalog products of the same handle. Only the columns the
 * file has change anything, and variants are never deleted (see `mergeIntoExisting`). Handles
 * not in the catalog are skipped: creating products is the create mode's job. Stock is left
 * as it is.
 */
@Injectable()
export class UpdateProductsStrategy implements CatalogImportStrategy {
  readonly mode = CatalogImportMode.Update;

  constructor(
    @Inject(CATALOG_FILE_PARSERS) private readonly parsers: CatalogFileParser[],
    private readonly products: ProductRepository,
    private readonly updateWriter: ProductUpdateWriter,
    private readonly conflicts: CatalogConflictsService,
  ) {}

  supports(format: CatalogImportFormat): boolean {
    return this.parsers.some((parser) => parser.format === format);
  }

  async run(workspaceId: string, request: CatalogImportRequest): Promise<ImportOutcome> {
    const { format, content } = request;
    const parsed = findParser(this.parsers, format).parse(content, { partial: true });
    const { replacements, notFound, failed } = await this.matchExisting(workspaceId, parsed);
    const { accepted, skuConflicts } = await this.conflicts.checkReplacements(
      workspaceId,
      replacements,
    );
    for (const { productId, draft } of accepted) {
      await this.updateWriter.update(workspaceId, productId, draft, request.actor);
    }
    return {
      ...emptyOutcome(),
      updatedProducts: accepted.length,
      productIds: accepted.map((replacement) => replacement.productId),
      skipped: withRows(notFound, parsed.rowByHandle),
      failed: withRows([...parsed.issues, ...failed, ...skuConflicts], parsed.rowByHandle),
    };
  }

  /** Merges each file product into the catalog product of its handle, loaded in one query. */
  private async matchExisting(
    workspaceId: string,
    parsed: CatalogParseResult,
  ): Promise<MatchedProducts> {
    const targets = await this.products.findUpdateTargets(
      workspaceId,
      parsed.products.map((draft) => draft.handle),
    );
    const targetByHandle = new Map(targets.map((target) => [target.handle, target]));
    const matched: MatchedProducts = { replacements: [], notFound: [], failed: [] };
    for (const values of parsed.products) {
      const target = targetByHandle.get(values.handle);
      if (target) {
        this.merge(target, new ProductPatch(values, parsed.fields), parsed, matched);
      } else {
        matched.notFound.push({
          code: ImportIssueCode.NotFound,
          message: 'No product with this handle is in the catalog; nothing was updated',
          handle: values.handle,
        });
      }
    }
    return matched;
  }

  /** Validates the merged product as a whole, as any other product is before it is written. */
  private merge(
    target: ProductUpdateTargetRecord,
    patch: ProductPatch,
    parsed: CatalogParseResult,
    matched: MatchedProducts,
  ): void {
    const { draft, unmatchedVariants } = mergeIntoExisting(toProductDraft(target), patch);
    const merged = normalizeDraft(draft);
    const [problem] = findDraftProblems(merged);
    if (problem) {
      matched.failed.push({ ...problem, handle: patch.handle });
      return;
    }
    const variantRows = parsed.variantRowsByHandle.get(patch.handle) ?? [];
    matched.failed.push(
      ...unmatchedVariants.map((index) => unmatchedVariant(patch, index, variantRows[index])),
    );
    matched.replacements.push({ productId: target.id, draft: merged });
  }
}

function unmatchedVariant(patch: ProductPatch, index: number, row?: number): ImportIssue {
  return {
    code: ImportIssueCode.UnmatchedVariant,
    message:
      'No variant of this product has this SKU or these option values, and a new variant ' +
      'needs a value for each option; the row was not applied',
    handle: patch.handle,
    sku: patch.variants[index]?.values.sku,
    row,
  };
}
