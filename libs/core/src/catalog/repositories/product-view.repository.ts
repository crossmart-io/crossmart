import { Injectable } from '@nestjs/common';
import { PrismaService, type ProductView } from '@crossmart/database';
import type { ProductViewDraft } from '../entities/product-view.js';

@Injectable()
export class ProductViewRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(workspaceId: string): Promise<ProductView[]> {
    return this.prisma.productView.findMany({
      where: { workspaceId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  count(workspaceId: string): Promise<number> {
    return this.prisma.productView.count({ where: { workspaceId } });
  }

  async nameTaken(workspaceId: string, name: string): Promise<boolean> {
    const existing = await this.prisma.productView.findFirst({
      where: { workspaceId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    return existing !== null;
  }

  create(workspaceId: string, draft: ProductViewDraft): Promise<ProductView> {
    return this.prisma.productView.create({
      data: {
        workspaceId,
        name: draft.name,
        search: draft.search ?? null,
        status: draft.status ?? null,
        gap: draft.gap ?? null,
      },
    });
  }

  /** Returns false when the view does not exist in this workspace. */
  async delete(workspaceId: string, viewId: string): Promise<boolean> {
    const { count } = await this.prisma.productView.deleteMany({
      where: { id: viewId, workspaceId },
    });
    return count > 0;
  }
}
