import { Injectable } from '@nestjs/common';
import type { ExternalOrderLine } from '@crossmart/connectors';
import { PrismaService } from '@crossmart/database';

const INSENSITIVE = 'insensitive' as const;

/**
 * Finds the Crossmart variant each order line sells: by the channel variant id the
 * connection's listings recorded, else by SKU in the workspace (products sold on the
 * channel before Crossmart listed them).
 */
@Injectable()
export class OrderVariantMatcher {
  constructor(private readonly prisma: PrismaService) {}

  async match(
    workspaceId: string,
    connectionId: string,
    lines: readonly ExternalOrderLine[],
  ): Promise<Map<string, string>> {
    const byExternalId = await this.byChannelVariant(workspaceId, connectionId, lines);
    const bySku = await this.bySku(workspaceId, lines);
    const matches = new Map<string, string>();
    for (const line of lines) {
      const variantId =
        (line.externalVariantId && byExternalId.get(line.externalVariantId)) ||
        (line.sku && bySku.get(line.sku.toLowerCase()));
      if (variantId) matches.set(line.externalId, variantId);
    }
    return matches;
  }

  private async byChannelVariant(
    workspaceId: string,
    connectionId: string,
    lines: readonly ExternalOrderLine[],
  ): Promise<Map<string, string>> {
    const ids = lines.flatMap((line) => (line.externalVariantId ? [line.externalVariantId] : []));
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.listingVariant.findMany({
      where: { workspaceId, externalId: { in: ids }, listing: { connectionId } },
      select: { externalId: true, variantId: true },
    });
    return new Map(rows.map((row) => [row.externalId, row.variantId]));
  }

  private async bySku(
    workspaceId: string,
    lines: readonly ExternalOrderLine[],
  ): Promise<Map<string, string>> {
    const skus = lines.flatMap((line) => (line.sku ? [line.sku] : []));
    if (skus.length === 0) return new Map();
    const rows = await this.prisma.variant.findMany({
      where: { workspaceId, sku: { in: skus, mode: INSENSITIVE } },
      select: { id: true, sku: true },
    });
    return new Map(rows.flatMap((row) => (row.sku ? [[row.sku.toLowerCase(), row.id]] : [])));
  }
}
