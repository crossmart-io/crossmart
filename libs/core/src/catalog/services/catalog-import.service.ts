import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CATALOG_FILE_PARSERS, IMPORT_PRODUCT_BATCH_SIZE } from '../catalog.constants.js';
import type { CatalogFileParser, CatalogImportResult } from '../entities/catalog-import.js';
import type { ProductDraft } from '../entities/product-draft.js';
import type { CatalogImportFormat } from '../enums/catalog-import-format.enum.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { normalizeDraft } from '../rules/normalize-draft.js';
import { CatalogConflictsService } from './catalog-conflicts.service.js';

/**
 * Imports a catalog file. Products already in the catalog (same handle) are skipped, never
 * overwritten; invalid products are reported and the rest are created.
 */
@Injectable()
export class CatalogImportService {
  constructor(
    @Inject(CATALOG_FILE_PARSERS) private readonly parsers: CatalogFileParser[],
    private readonly products: ProductRepository,
    private readonly conflicts: CatalogConflictsService,
  ) {}

  async importFile(
    workspaceId: string,
    format: CatalogImportFormat,
    content: Buffer,
  ): Promise<CatalogImportResult> {
    const { products, issues } = this.parserFor(format).parse(content);
    const drafts = products.map((draft) => normalizeDraft(draft));
    const { accepted, existing, skuConflicts } = await this.conflicts.check(workspaceId, drafts);
    await this.createInBatches(workspaceId, accepted);
    return {
      createdProducts: accepted.length,
      createdVariants: accepted.reduce((sum, draft) => sum + draft.variants.length, 0),
      skipped: existing,
      failed: [...issues, ...skuConflicts],
    };
  }

  private parserFor(format: CatalogImportFormat): CatalogFileParser {
    const parser = this.parsers.find((candidate) => candidate.format === format);
    if (!parser) {
      throw new BadRequestException(`Unsupported import format: ${format}`);
    }
    return parser;
  }

  private async createInBatches(workspaceId: string, drafts: ProductDraft[]): Promise<void> {
    for (let start = 0; start < drafts.length; start += IMPORT_PRODUCT_BATCH_SIZE) {
      await this.products.createAll(
        workspaceId,
        drafts.slice(start, start + IMPORT_PRODUCT_BATCH_SIZE),
      );
    }
  }
}
