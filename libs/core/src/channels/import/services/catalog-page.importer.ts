import { Injectable } from '@nestjs/common';
import type { ExternalProduct } from '@crossmart/connectors';
import { InventoryMovementReason } from '@crossmart/database';
import { ImportIssueCode } from '../../../catalog/enums/import-issue-code.enum.js';
import type { OutcomeIssue } from '../../../catalog/repositories/import-job.repository.js';
import { StockLevelsService } from '../../../inventory/services/stock-levels.service.js';
import { type ListingRecord, ListingRepository } from '../../repositories/listing.repository.js';
import type { ImportPageContext, PageOutcome, ProductMatch } from '../entities/channel-import.js';
import { ProductMatchKind } from '../enums/product-match-kind.enum.js';
import { toListingStatus } from '../mappers/external-product.mapper.js';
import { alreadyLinkedIssue, failedIssue, unmatchedVariantIssue } from '../rules/import-issues.js';
import { matchVariants } from '../rules/variant-matching.js';
import { ChannelProductCreator } from './channel-product.creator.js';
import { ProductMatcher } from './product-matcher.js';

/** A matched product's refreshed or new listing, or why it got none. */
interface LinkResult {
  listing: ListingRecord | null;
  issues: OutcomeIssue[];
}

/** Kinds that link a channel product to a catalog product that is already there. */
const LINKING_KINDS: ReadonlySet<ProductMatchKind> = new Set([
  ProductMatchKind.Linked,
  ProductMatchKind.Handle,
  ProductMatchKind.Sku,
]);

/**
 * Imports one page of a channel's catalog: creates what is new, links what the catalog
 * already holds, records every listing with its variant ids, and sets the new products' stock
 * through the inventory ledger. Counts are of products, so they add up to the page; variants
 * that could not be linked are reported as issues of a linked product. Writes are batched per page; linked products keep their
 * catalog content and stock, because Crossmart is their source of truth from then on.
 */
@Injectable()
export class CatalogPageImporter {
  constructor(
    private readonly matcher: ProductMatcher,
    private readonly creator: ChannelProductCreator,
    private readonly listings: ListingRepository,
    private readonly stock: StockLevelsService,
  ) {}

  async importPage(context: ImportPageContext, products: ExternalProduct[]): Promise<PageOutcome> {
    const matches = await this.matcher.match(context, products);
    const created = await this.creator.create(
      context,
      matches.filter((match) => match.kind === ProductMatchKind.New).map((match) => match.product),
    );
    const linking = matches.filter((match) => LINKING_KINDS.has(match.kind));
    const links = linking.map((match) => this.link(context, match));
    const taken = matches.filter((match) => match.kind === ProductMatchKind.Taken);
    await this.listings.upsertManyByExternalId([
      ...created.listings,
      ...links.flatMap((link) => (link.listing ? [link.listing] : [])),
    ]);
    await this.stock.setAvailable(context.workspaceId, created.stock, {
      reason: InventoryMovementReason.IMPORTED,
      actor: context.actor,
    });
    const issues = [
      ...created.issues,
      ...links.flatMap((link) => link.issues),
      ...taken.map((match) => alreadyLinkedIssue(match.product)),
    ];
    return {
      created: created.created,
      linked: this.countLinked(linking, links, (kind) => kind !== ProductMatchKind.Linked),
      updated: this.countLinked(linking, links, (kind) => kind === ProductMatchKind.Linked),
      skipped: taken.length,
      failed: created.failed + links.filter((link) => !link.listing).length,
      issues,
    };
  }

  private countLinked(
    matches: ProductMatch[],
    links: LinkResult[],
    counts: (kind: ProductMatchKind) => boolean,
  ): number {
    return matches.filter((match, index) => links[index].listing && counts(match.kind)).length;
  }

  /** Maps the variants; a product none of whose variants match is not linked. */
  private link(context: ImportPageContext, match: ProductMatch): LinkResult {
    const { product, target, knownVariants } = match;
    const { mappings, unmatched } = matchVariants(
      product.variants,
      target?.variants ?? [],
      knownVariants,
    );
    if (!target || mappings.length === 0) {
      return { listing: null, issues: [this.noVariantMatched(product)] };
    }
    return {
      listing: {
        workspaceId: context.workspaceId,
        connectionId: context.connectionId,
        productId: target.id,
        externalId: product.externalId,
        externalUrl: product.externalUrl,
        status: toListingStatus(product),
        syncedAt: context.syncedAt,
        variants: mappings,
      },
      issues: unmatched.map((variant) => unmatchedVariantIssue(product, variant)),
    };
  }

  private noVariantMatched(product: ExternalProduct): OutcomeIssue {
    return failedIssue({
      code: ImportIssueCode.UnmatchedVariant,
      message: 'No variant matches a variant of the catalog product, so it was not linked',
      handle: product.handle,
    });
  }
}
