import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ActivityOutcome } from '@crossmart/database';
import type { ActivityEntry } from '../../activity/entities/activity-entry.js';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
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
    private readonly activity: ActivityRecorder,
  ) {}

  /** Imports the file and records the outcome in the activity log, including a failed import. */
  async importFile(
    workspaceId: string,
    format: CatalogImportFormat,
    content: Buffer,
    actor: Actor,
  ): Promise<CatalogImportResult> {
    let result: CatalogImportResult;
    try {
      result = await this.runImport(workspaceId, format, content);
    } catch (error) {
      await this.activity.recordFailure(workspaceId, actor, IMPORT_ENTRY, error);
      throw error;
    }
    await this.activity.record(workspaceId, actor, toActivityEntry(result));
    return result;
  }

  private async runImport(
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

const NOTHING_IMPORTED = 'No product in the file could be imported';

const IMPORT_ENTRY: ActivityEntry = {
  action: ActivityAction.ProductsImported,
  subject: { type: ActivitySubjectType.CatalogImport },
};

/** An import that created nothing but rejected products failed; anything else succeeded. */
function toActivityEntry(result: CatalogImportResult): ActivityEntry {
  const failed = result.failed.length;
  const counts = [
    result.skipped.length > 0 ? `${result.skipped.length} skipped` : null,
    failed > 0 ? `${failed} failed` : null,
  ].filter((count) => count !== null);
  const isFailure = result.createdProducts === 0 && failed > 0;
  return {
    ...IMPORT_ENTRY,
    itemCount: result.createdProducts,
    detail: counts.length > 0 ? counts.join(', ') : undefined,
    ...(isFailure
      ? {
          outcome: ActivityOutcome.FAILED,
          failureReason: NOTHING_IMPORTED,
        }
      : {}),
  };
}
