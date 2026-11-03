import { Injectable } from '@nestjs/common';
import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import type {
  CatalogFileParser,
  CatalogParseOptions,
  CatalogParseResult,
  ImportIssue,
} from '../../entities/catalog-import.js';
import type { MediaDraft, ProductDraft, VariantDraft } from '../../entities/product-draft.js';
import { CatalogImportFormat } from '../../enums/catalog-import-format.enum.js';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import { ProductDraftField } from '../../enums/product-draft-field.enum.js';
import { findDraftProblems } from '../../rules/product-draft.rules.js';
import {
  assertCsvColumns,
  type CsvRecord,
  FIRST_DATA_ROW,
  readCsvRecords,
} from '../csv/csv-records.js';
import {
  SHOPIFY_CONTINUE_SELLING_POLICY,
  SHOPIFY_DEFAULT_OPTION_NAME,
  SHOPIFY_DEFAULT_OPTION_VALUE,
  SHOPIFY_FIELD_COLUMNS,
  SHOPIFY_OPTION_COLUMNS,
  SHOPIFY_PARTIAL_REQUIRED_COLUMNS,
  SHOPIFY_REQUIRED_COLUMNS,
  SHOPIFY_TAG_SEPARATOR,
  ShopifyCsvColumn,
} from './shopify-csv-column.enum.js';
import { ShopifyCsvRow, ShopifyRowError } from './shopify-csv-row.js';

const SHOPIFY_FILE_KIND = 'a Shopify product CSV';
/** Stands in for a required value whose column a partial file lacks; it is never written. */
const UNSPECIFIED_VALUE = '';
const SHOPIFY_COLUMNS: ReadonlySet<string> = new Set(Object.values(ShopifyCsvColumn));

const STATUS_BY_SHOPIFY_VALUE: Readonly<Record<string, ProductStatus>> = {
  active: ProductStatus.ACTIVE,
  draft: ProductStatus.DRAFT,
  archived: ProductStatus.ARCHIVED,
};

/** What the parse of one file knows beyond a single row. */
interface ShopifyFileContext {
  /** The Shopify columns in the file's header. */
  columns: ReadonlySet<ShopifyCsvColumn>;
  partial: boolean;
}

/**
 * Reads Shopify's product CSV: one row per variant, grouped by Handle. The first row of a
 * handle carries the product fields; rows with only an Image Src add images.
 */
@Injectable()
export class ShopifyCsvParser implements CatalogFileParser {
  readonly format = CatalogImportFormat.ShopifyCsv;

  parse(content: Buffer, { partial = false }: CatalogParseOptions = {}): CatalogParseResult {
    const records = readCsvRecords(content);
    assertCsvColumns(
      records,
      partial ? SHOPIFY_PARTIAL_REQUIRED_COLUMNS : SHOPIFY_REQUIRED_COLUMNS,
      SHOPIFY_FILE_KIND,
    );
    const context: ShopifyFileContext = { columns: this.readHeader(records), partial };
    const result = { products: [] as ProductDraft[], issues: [] as ImportIssue[] };
    const rowByHandle = new Map<string, number>();
    const variantRowsByHandle = new Map<string, number[]>();
    for (const [handle, rows] of this.groupByHandle(this.toRows(records))) {
      rowByHandle.set(handle, rows[0]?.row ?? FIRST_DATA_ROW);
      variantRowsByHandle.set(
        handle,
        this.variantRows(rows).map((row) => row.row),
      );
      const outcome = this.toDraft(handle, rows, context);
      if ('issue' in outcome) {
        result.issues.push(outcome.issue);
      } else {
        result.products.push(outcome.draft);
      }
    }
    return { ...result, rowByHandle, variantRowsByHandle, fields: this.fieldsOf(context.columns) };
  }

  private toRows(records: CsvRecord[]): ShopifyCsvRow[] {
    return records.map((cells, index) => new ShopifyCsvRow(index + FIRST_DATA_ROW, cells));
  }

  /** The header is the keys of the first record; the caller has checked there is one. */
  private readHeader(records: CsvRecord[]): ReadonlySet<ShopifyCsvColumn> {
    const header = Object.keys(records[0] ?? {});
    return new Set(header.filter((name): name is ShopifyCsvColumn => SHOPIFY_COLUMNS.has(name)));
  }

  private fieldsOf(columns: ReadonlySet<ShopifyCsvColumn>): ReadonlySet<ProductDraftField> {
    return new Set(
      Object.values(ProductDraftField).filter((field) =>
        SHOPIFY_FIELD_COLUMNS[field].some((column) => columns.has(column)),
      ),
    );
  }

  /**
   * A full file must fill in its required columns. A partial file may leave a required column
   * out, but a column it has must be filled in.
   */
  private isRequired(column: ShopifyCsvColumn, context: ShopifyFileContext): boolean {
    return !context.partial || context.columns.has(column);
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

  /** A partial file's drafts are validated once merged into the catalog, not here. */
  private toDraft(
    handle: string,
    rows: ShopifyCsvRow[],
    context: ShopifyFileContext,
  ): { draft: ProductDraft } | { issue: ImportIssue } {
    const [productRow] = rows;
    try {
      const draft = this.buildDraft(handle, rows, context);
      const [problem] = context.partial ? [] : findDraftProblems(draft);
      return problem ? { issue: { ...problem, handle, row: productRow?.row } } : { draft };
    } catch (error) {
      if (error instanceof ShopifyRowError) {
        return { issue: { code: error.code, message: error.message, handle, row: error.row } };
      }
      throw error;
    }
  }

  private buildDraft(
    handle: string,
    rows: ShopifyCsvRow[],
    context: ShopifyFileContext,
  ): ProductDraft {
    const [productRow] = rows as [ShopifyCsvRow, ...ShopifyCsvRow[]];
    const optionNames = this.readOptionNames(productRow);
    return {
      handle,
      title: this.isRequired(ShopifyCsvColumn.Title, context)
        ? productRow.requiredText(ShopifyCsvColumn.Title)
        : UNSPECIFIED_VALUE,
      descriptionHtml: productRow.raw(ShopifyCsvColumn.BodyHtml),
      vendor: productRow.text(ShopifyCsvColumn.Vendor),
      productType: productRow.text(ShopifyCsvColumn.Type),
      tags: this.readTags(productRow),
      status: this.readStatus(productRow),
      optionNames,
      variants: this.variantRows(rows).map((row) =>
        this.readVariant(row, optionNames.length, context),
      ),
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

  /** The rows that describe a variant, as opposed to rows that only add an image. */
  private variantRows(rows: ShopifyCsvRow[]): ShopifyCsvRow[] {
    return rows.filter((row) => this.hasVariantData(row));
  }

  private hasVariantData(row: ShopifyCsvRow): boolean {
    return [
      ShopifyCsvColumn.Option1Value,
      ShopifyCsvColumn.VariantSku,
      ShopifyCsvColumn.VariantPrice,
    ].some((column) => row.text(column) !== undefined);
  }

  private readVariant(
    row: ShopifyCsvRow,
    optionCount: number,
    context: ShopifyFileContext,
  ): VariantDraft {
    return {
      sku: row.text(ShopifyCsvColumn.VariantSku),
      barcode: row.text(ShopifyCsvColumn.VariantBarcode),
      optionValues: SHOPIFY_OPTION_COLUMNS.slice(0, optionCount).map(
        ({ value }) => row.text(value) ?? '',
      ),
      price: this.isRequired(ShopifyCsvColumn.VariantPrice, context)
        ? row.requiredAmount(ShopifyCsvColumn.VariantPrice)
        : UNSPECIFIED_VALUE,
      compareAtPrice: row.amount(ShopifyCsvColumn.VariantCompareAtPrice),
      cost: row.amount(ShopifyCsvColumn.CostPerItem),
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
