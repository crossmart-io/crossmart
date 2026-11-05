import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';

export interface ProductTitle {
  id: string;
  title: string;
}

/** Looks products up by id inside one workspace, to check a request names only its own. */
@Injectable()
export class ContentProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTitles(workspaceId: string, productIds: readonly string[]): Promise<ProductTitle[]> {
    return this.prisma.product.findMany({
      where: { workspaceId, id: { in: [...productIds] } },
      select: { id: true, title: true },
    });
  }
}
