import type { ExternalProduct } from '@crossmart/connectors';
import type { Actor } from '../../../activity/entities/actor.js';
import type { OutcomeIssue } from '../../../catalog/repositories/import-job.repository.js';
import type { ListingVariantMapping } from '../../repositories/listing.repository.js';
import type { ProductMatchKind } from '../enums/product-match-kind.enum.js';

/** What the queue carries: only ids. Everything else is read from the import job. */
export interface ChannelImportJobRef {
  workspaceId: string;
  jobId: string;
}

export interface ChannelImportRunOptions {
  /** The queue will not retry this run, so a failure marks the import as failed. */
  finalAttempt: boolean;
}

/** The import a page belongs to. */
export interface ImportPageContext {
  workspaceId: string;
  connectionId: string;
  actor: Actor;
  /** When the page was written; the listings it touches are stamped with it. */
  syncedAt: Date;
}

/** A catalog variant, with what channel variants are matched on. */
export interface CatalogVariantRef {
  id: string;
  sku: string | null;
  optionValues: string[];
}

export interface CatalogProductRef {
  id: string;
  variants: CatalogVariantRef[];
}

/** A channel product and the catalog product it belongs to, if any. */
export interface ProductMatch {
  product: ExternalProduct;
  kind: ProductMatchKind;
  /** Set unless `kind` is `New`. */
  target?: CatalogProductRef;
  /** Variant mappings the listing already holds, by external variant id. */
  knownVariants?: ReadonlyMap<string, string>;
}

/** What importing one page did, in products; the counts add up to the page's products. */
export interface PageOutcome {
  created: number;
  linked: number;
  updated: number;
  skipped: number;
  failed: number;
  issues: OutcomeIssue[];
}

/** The variant mappings of a product, and the channel variants that matched nothing. */
export interface VariantMatchResult {
  mappings: ListingVariantMapping[];
  unmatched: ExternalProduct['variants'];
}
