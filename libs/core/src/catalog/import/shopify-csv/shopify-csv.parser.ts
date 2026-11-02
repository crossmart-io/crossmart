import { BadRequestException, Injectable } from '@nestjs/common';
import { parse as parseCsv } from 'csv-parse/sync';
import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import { IMPORT_MAX_ROWS } from '../../catalog.constants.js';
import type {
  CatalogFileParser,
  CatalogParseResult,
  ImportIssue,
} from '../../entities/catalog-import.js';
import type { MediaDraft, ProductDraft, VariantDraft } from '../../entities/product-draft.js';
import { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import { findDraftProblems } from '../../rules/product-draft.rules.js';
import {
  SHOPIFY_CONTINUE_SELLING_POLICY,
  SHOPIFY_DEFAULT_OPTION_NAME,
  SHOPIFY_DEFAULT_OPTION_VALUE,
  SHOPIFY_OPTION_COLUMNS,
  SHOPIFY_REQUIRED_COLUMNS,
  SHOPIFY_TAG_SEPARATOR,
  ShopifyCsvColumn,
} from './shopify-csv-column.enum.js';
import { ShopifyCsvRow, ShopifyRowError } from './shopify-csv-row.js';

/** The header is spreadsheet row 1, so the first record is row 2. */
const FIRST_DATA_ROW = 2;

const STATUS_BY_SHOPIFY_VALUE: Readonly<Record<string, ProductStatus>> = {
  active: ProductStatus.ACTIVE,
  draft: ProductStatus.DRAFT,
  archived: ProductStatus.ARCHIVED,
};

/**
 * Reads Shopify's product CSV: one row per variant, grouped by Handle. The first row of a
 * handle carries the product fields; rows with only an Image Src add images.
 */
@Injectable()
export class ShopifyCsvParser implements CatalogFileParser {
  readonly format = CatalogImportFormat.ShopifyCsv;

  parse(content: Buffer): CatalogParseResult {
    const products: ProductDraft[] = [];
    const issues: ImportIssue[] = [];
    for (const [handle, rows] of this.groupByHandle(this.readRows(content))) {
      const outcome = this.toDraft(handle, rows);
      if ('issue' in outcome) {
        issues.push(outcome.issue);
      } else {
        products.push(outcome.draft);
      }
    }
    return { products, issues };
  }

  private readRows(content: Buffer): ShopifyCsvRow[] {
    const records = this.parseRecords(content);
    if (records.length > IMPORT_MAX_ROWS) {
      throw new BadRequestException(`The file has more than ${IMPORT_MAX_ROWS} rows`);
    }
    return records.map((cells, index) => new ShopifyCsvRow(index + FIRST_DATA_ROW, cells));
  }

  private parseRecords(content: Buffer): Record<string, string>[] {
    let records: Record<string, string>[];
    try {
      records = parseCsv(content, {
        columns: true,
        bom: true,
        skip_empty_lines: true,
        relax_column_count: true,
      });
    } catch {
      throw new BadRequestException('The file is not a readable CSV');
    }
    this.assertShopifyHeader(records);
    return records;
  }

  private assertShopifyHeader(records: Record<string, string>[]): void {
    const [firstRecord] = records;
    const missing = SHOPIFY_REQUIRED_COLUMNS.filter(
      (column) => !firstRecord || !(column in firstRecord),
    );
    if (missing.length > 0) {
      throw new BadRequestException(
        `This does not look like a Shopify product CSV: missing ${missing.join(', ')}`,
      );
    }
  }

  private groupByHandle(rows: ShopifyCsvRow[]): Map<string, ShopifyCsvRow[]> {
    const groups = new Map<string, ShopifyCsvRow[]>();
    for (const row of rows) {
      const handle = row.text(ShopifyCsvColumn.Handle);
      if (handle === undefined) continue;
      groups.set(handle, [...(groups.get(handle) ?? []), row]);
    }
    return groups;
  }

  private toDraft(
    handle: string,
    rows: ShopifyCsvRow[],
  ): { draft: ProductDraft } | { issue: ImportIssue } {
    const [productRow] = rows;
    try {
      const draft = this.buildDraft(handle, rows);
      const [problem] = findDraftProblems(draft);
      return problem ? { issue: { ...problem, handle, row: productRow?.row } } : { draft };
    } catch (error) {
      if (error instanceof ShopifyRowError) {
        return { issue: { code: error.code, message: error.message, handle, row: error.row } };
      }
      throw error;
    }
  }

  private buildDraft(handle: string, rows: ShopifyCsvRow[]): ProductDraft {
    const [productRow] = rows as [ShopifyCsvRow, ...ShopifyCsvRow[]];
    const optionNames = this.readOptionNames(productRow);
    return {
      handle,
      title: productRow.requiredText(ShopifyCsvColumn.Title),
      descriptionHtml: productRow.raw(ShopifyCsvColumn.BodyHtml),
      vendor: productRow.text(ShopifyCsvColumn.Vendor),
      productType: productRow.text(ShopifyCsvColumn.Type),
      tags: this.readTags(productRow),
      status: this.readStatus(productRow),
      optionNames,
      variants: rows
        .filter((row) => this.hasVariantData(row))
        .map((row) => this.readVariant(row, optionNames.length)),
      media: this.readMedia(rows),
    };
  }

  /** Option names in order. Shopify's placeholder "Title" option means no options at all. */
  private readOptionNames(productRow: ShopifyCsvRow): string[] {
    const names: string[] = [];
    for (const { name } of SHOPIFY_OPTION_COLUMNS) {
      const optionName = productRow.text(name);
      if (optionName === undefined) break;
      names.push(optionName);
    }
    const isPlaceholder =
      names.length === 1 &&
      names[0] === SHOPIFY_DEFAULT_OPTION_NAME &&
      productRow.text(ShopifyCsvColumn.Option1Value) === SHOPIFY_DEFAULT_OPTION_VALUE;
    return isPlaceholder ? [] : names;
  }

  private readTags(productRow: ShopifyCsvRow): string[] {
    const tags = (productRow.text(ShopifyCsvColumn.Tags) ?? '')
      .split(SHOPIFY_TAG_SEPARATOR)
      .map((tag) => tag.trim())
      .filter(Boolean);
    return [...new Set(tags)];
  }

  /** Newer exports have a Status column; older ones only say whether the product is published. */
  private readStatus(productRow: ShopifyCsvRow): ProductStatus {
    const status = productRow.text(ShopifyCsvColumn.Status)?.toLowerCase();
    if (status === undefined) {
      return productRow.boolean(ShopifyCsvColumn.Published, false)
        ? ProductStatus.ACTIVE
        : ProductStatus.DRAFT;
    }
    const mapped = STATUS_BY_SHOPIFY_VALUE[status];
    if (!mapped) {
      throw productRow.error(ImportIssueCode.InvalidValue, `Unknown status "${status}"`);
    }
    return mapped;
  }

  private hasVariantData(row: ShopifyCsvRow): boolean {
    return [
      ShopifyCsvColumn.Option1Value,
      ShopifyCsvColumn.VariantSku,
      ShopifyCsvColumn.VariantPrice,
    ].some((column) => row.text(column) !== undefined);
  }

  private readVariant(row: ShopifyCsvRow, optionCount: number): VariantDraft {
    return {
      sku: row.text(ShopifyCsvColumn.VariantSku),
      barcode: row.text(ShopifyCsvColumn.VariantBarcode),
      optionValues: SHOPIFY_OPTION_COLUMNS.slice(0, optionCount).map(
        ({ value }) => row.text(value) ?? '',
      ),
      price: row.requiredAmount(ShopifyCsvColumn.VariantPrice),
      compareAtPrice: row.amount(ShopifyCsvColumn.VariantCompareAtPrice),
      weightGrams: row.integer(ShopifyCsvColumn.VariantGrams),
      requiresShipping: row.boolean(ShopifyCsvColumn.VariantRequiresShipping, true),
      taxable: row.boolean(ShopifyCsvColumn.VariantTaxable, true),
      outOfStockPolicy:
        row.text(ShopifyCsvColumn.VariantInventoryPolicy)?.toLowerCase() ===
        SHOPIFY_CONTINUE_SELLING_POLICY
          ? OutOfStockPolicy.CONTINUE_SELLING
          : OutOfStockPolicy.STOP_SELLING,
      inventory: {
        tracked: row.text(ShopifyCsvColumn.VariantInventoryTracker) !== undefined,
        quantity: row.integer(ShopifyCsvColumn.VariantInventoryQty) ?? 0,
      },
    };
  }

  /** Images in their Image Position order, each URL once. */
  private readMedia(rows: ShopifyCsvRow[]): MediaDraft[] {
    const images: (MediaDraft & { position: number })[] = [];
    for (const row of rows) {
      const url = row.url(ShopifyCsvColumn.ImageSrc);
      if (url === undefined || images.some((image) => image.url === url)) continue;
      images.push({
        url,
        altText: row.text(ShopifyCsvColumn.ImageAltText),
        position: row.integer(ShopifyCsvColumn.ImagePosition) ?? Number.MAX_SAFE_INTEGER,
      });
    }
    return images
      .sort((left, right) => left.position - right.position)
      .map(({ url, altText }) => ({ url, altText }));
  }
}
