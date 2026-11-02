import { Inject, Injectable } from '@nestjs/common';
import { CATALOG_FILE_PARSERS } from '../../catalog.constants.js';
import type {
  CatalogFileParser,
  CatalogImportRequest,
  CatalogImportStrategy,
  ImportIssue,
  ImportOutcome,
} from '../../entities/catalog-import.js';
import type { ProductDraft } from '../../entities/product-draft.js';
import type { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../../enums/catalog-import-mode.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import { ProductUpdateWriter } from '../../repositories/product-update.writer.js';
import { ProductRepository } from '../../repositories/product.repository.js';
import { normalizeDraft } from '../../rules/normalize-draft.js';
import {
  CatalogConflictsService,
  type ProductReplacement,
} from '../../services/catalog-conflicts.service.js';
import { findParser } from '../find-parser.js';
import { emptyOutcome, withRows } from '../import-issues.js';
import { mergeWithExisting } from './existing-product-merge.js';

interface MatchedProducts {
  replacements: ProductReplacement[];
  notFound: ImportIssue[];
}

/**
 * Replaces catalog products with the file's products of the same handle. Handles not in the
 * catalog are skipped: creating products is the create mode's job. Stock is left as it is.
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
    const { products, issues, rowByHandle } = findParser(this.parsers, format).parse(content);
    const drafts = products.map((draft) => normalizeDraft(draft));
    const { replacements, notFound } = await this.matchExisting(workspaceId, drafts);
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
      skipped: withRows(notFound, rowByHandle),
      failed: withRows([...issues, ...skuConflicts], rowByHandle),
    };
  }

  /** Pairs each draft with the catalog product of its handle, in one query. */
  private async matchExisting(
    workspaceId: string,
    drafts: ProductDraft[],
  ): Promise<MatchedProducts> {
    const targets = await this.products.findUpdateTargets(
      workspaceId,
      drafts.map((draft) => draft.handle),
    );
    const targetByHandle = new Map(targets.map((target) => [target.handle, target]));
    const matched: MatchedProducts = { replacements: [], notFound: [] };
    for (const draft of drafts) {
      const target = targetByHandle.get(draft.handle);
      if (target) {
        matched.replacements.push({
          productId: target.id,
          draft: mergeWithExisting(draft, target),
        });
      } else {
        matched.notFound.push({
          code: ImportIssueCode.NotFound,
          message: 'No product with this handle is in the catalog; nothing was updated',
          handle: draft.handle,
        });
      }
    }
    return matched;
  }
}
