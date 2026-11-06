import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';
import type { AiPlatformUsageRecordInput } from '../entities/ai-usage.js';

/** The append-only `platform_ai_usage` table: AI calls Crossmart pays for, outside workspaces. */
@Injectable()
export class PlatformAiUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: AiPlatformUsageRecordInput): Promise<void> {
    await this.prisma.platformAiUsage.create({ data: input, select: { id: true } });
  }
}
