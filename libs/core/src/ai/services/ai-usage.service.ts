import { Injectable } from '@nestjs/common';
import { findEnumValue } from '@crossmart/common';
import type {
  AiUsageLine,
  AiUsagePeriod,
  AiUsageRecordInput,
  AiUsageReport,
  AiUsageTotals,
} from '../entities/ai-usage.js';
import { AiFeature } from '../enums/ai-feature.enum.js';
import { type AiUsageGroup, AiUsageRepository } from '../repositories/ai-usage.repository.js';
import { AI_USAGE_DEFAULT_PERIOD_MONTHS } from '../ai.constants.js';

const NO_USAGE: AiUsageTotals = { calls: 0, inputTokens: 0, outputTokens: 0 };

/**
 * Meters AI calls and reports them per workspace and period. It never enforces limits:
 * plans and credits read `report` and decide.
 */
@Injectable()
export class AiUsageService {
  constructor(private readonly usage: AiUsageRepository) {}

  record(input: AiUsageRecordInput): Promise<void> {
    return this.usage.create(input);
  }

  /** Usage in the period, per feature and model; the current UTC month when none is given. */
  async report(workspaceId: string, period?: AiUsagePeriod): Promise<AiUsageReport> {
    const window = period ?? AiUsageService.currentMonth(new Date());
    const groups = await this.usage.sumByFeatureAndModel(workspaceId, window);
    const lines = groups.flatMap((group) => AiUsageService.toLine(group));
    return { ...window, totals: AiUsageService.sum(lines), lines };
  }

  /** From the first day of the month of `now`, in UTC, to the first day of the next. */
  static currentMonth(now: Date): AiUsagePeriod {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()));
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + AI_USAGE_DEFAULT_PERIOD_MONTHS),
    );
    return { from, to };
  }

  /** Rows of features this version does not know (written by a newer one) are left out. */
  private static toLine(group: AiUsageGroup): AiUsageLine[] {
    const feature = findEnumValue(AiFeature, group.feature);
    return feature ? [{ ...group, feature }] : [];
  }

  private static sum(lines: AiUsageLine[]): AiUsageTotals {
    return lines.reduce(
      (totals, line) => ({
        calls: totals.calls + line.calls,
        inputTokens: totals.inputTokens + line.inputTokens,
        outputTokens: totals.outputTokens + line.outputTokens,
      }),
      NO_USAGE,
    );
  }
}
