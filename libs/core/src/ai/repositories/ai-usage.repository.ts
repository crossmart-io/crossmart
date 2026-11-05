import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';
import type { AiUsagePeriod, AiUsageRecordInput } from '../entities/ai-usage.js';

/** Calls of one feature with one model, summed. Feature is the stored text. */
export interface AiUsageGroup {
  feature: string;
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

/** The append-only `ai_usage` table. */
@Injectable()
export class AiUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: AiUsageRecordInput): Promise<void> {
    await this.prisma.aiUsage.create({ data: input, select: { id: true } });
  }

  /** Sums the workspace's calls in the period per feature and model, in one query. */
  async sumByFeatureAndModel(workspaceId: string, period: AiUsagePeriod): Promise<AiUsageGroup[]> {
    const groups = await this.prisma.aiUsage.groupBy({
      by: ['feature', 'model'],
      where: { workspaceId, createdAt: { gte: period.from, lt: period.to } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true },
      orderBy: [{ feature: 'asc' }, { model: 'asc' }],
    });
    return groups.map((group) => ({
      feature: group.feature,
      model: group.model,
      calls: group._count._all,
      inputTokens: group._sum.inputTokens ?? 0,
      outputTokens: group._sum.outputTokens ?? 0,
    }));
  }
}
