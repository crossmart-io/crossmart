import type { AiFeature } from '../enums/ai-feature.enum.js';
import type { AiProviderName } from '../enums/ai-provider-name.enum.js';
import type { AiTokenUsage } from './ai-completion.js';

/** One metered call, as it is recorded. */
export interface AiUsageRecordInput extends AiTokenUsage {
  workspaceId: string;
  feature: AiFeature;
  provider: AiProviderName;
  model: string;
}

/** One metered call the platform pays for, outside any workspace. */
export type AiPlatformUsageRecordInput = Omit<AiUsageRecordInput, 'workspaceId'>;

/** A half-open period: from its start, up to but not including its end. */
export interface AiUsagePeriod {
  from: Date;
  to: Date;
}

export interface AiUsageTotals extends AiTokenUsage {
  calls: number;
}

/** Usage of one feature with one model. */
export interface AiUsageLine extends AiUsageTotals {
  feature: AiFeature;
  model: string;
}

/** A workspace's AI usage in a period, for credits, plans and the usage page. */
export interface AiUsageReport extends AiUsagePeriod {
  totals: AiUsageTotals;
  lines: AiUsageLine[];
}
