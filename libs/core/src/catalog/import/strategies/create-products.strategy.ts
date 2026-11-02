import { Inject, Injectable } from '@nestjs/common';
import { CATALOG_FILE_PARSERS, IMPORT_PRODUCT_BATCH_SIZE } from '../../catalog.constants.js';
import type {
  CatalogFileParser,
  CatalogImportRequest,
  CatalogImportStrategy,
  ImportOutcome,
} from '../../entities/catalog-import.js';
import type { ProductDraft } from '../../entities/product-draft.js';
import type { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../../enums/catalog-import-mode.enum.js';
import { ProductRepository } from '../../repositories/product.repository.js';
import { normalizeDraft } from '../../rules/normalize-draft.js';
import { CatalogConflictsService } from '../../services/catalog-conflicts.service.js';
import { findParser } from '../find-parser.js';
import { emptyOutcome, withRows } from '../import-issues.js';

/**
 * Adds the file's new products. Products already in the catalog (same handle) are skipped,
 * never overwritten; invalid products are reported and the rest are created.
 */
@Injectable()
export class CreateProductsStrategy implements CatalogImportStrategy {
  readonly mode = CatalogImportMode.Create;

  constructor(
    @Inject(CATALOG_FILE_PARSERS) private readonly parsers: CatalogFileParser[],
    private readonly products: ProductRepository,
    private readonly conflicts: CatalogConflictsService,
  ) {}

  supports(format: CatalogImportFormat): boolean {
    return this.parsers.some((parser) => parser.format === format);
  }

  async run(workspaceId: string, request: CatalogImportRequest): Promise<ImportOutcome> {
    const { format, content } = request;
    const { products, issues, rowByHandle } = findParser(this.parsers, format).parse(content);
    const drafts = products.map((draft) => normalizeDraft(draft));
    const { accepted, existing, skuConflicts } = await this.conflicts.check(workspaceId, drafts);
    const productIds = await this.createInBatches(workspaceId, accepted);
    return {
      ...emptyOutcome(),
      productIds,
      createdProducts: accepted.length,
      createdVariants: accepted.reduce((sum, draft) => sum + draft.variants.length, 0),
      skipped: withRows(existing, rowByHandle),
      failed: withRows([...issues, ...skuConflicts], rowByHandle),
    };
  }

  private async createInBatches(workspaceId: string, drafts: ProductDraft[]): Promise<string[]> {
    const productIds: string[] = [];
    for (let start = 0; start < drafts.length; start += IMPORT_PRODUCT_BATCH_SIZE) {
      const batch = drafts.slice(start, start + IMPORT_PRODUCT_BATCH_SIZE);
      productIds.push(...(await this.products.createAll(workspaceId, batch)));
    }
    return productIds;
  }
}
