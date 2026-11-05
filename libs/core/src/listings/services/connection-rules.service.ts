import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ActivityEntry } from '../../activity/entities/activity-entry.js';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { CONNECTION_NOT_FOUND } from '../../channels/channels.constants.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { type PricingRule, pricingRuleSchema } from '../../channels/entities/pricing-rule.js';
import {
  type ProductSelectionRule,
  productSelectionRuleSchema,
} from '../../channels/entities/product-selection.js';
import type { ChannelConnectionRecord } from '../../channels/repositories/channel-connection.queries.js';
import { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { describePricingRule } from '../rules/describe-pricing-rule.js';

const SELECTION_CLEARED = 'automatic rule removed';

/** A selection without an automatic rule: only products added by hand are in the store. */
const NO_AUTOMATIC_RULE: ProductSelectionRule = {
  filter: null,
  includeProductIds: [],
  excludeProductIds: [],
};

/** A connection's merchant rules: its pricing rule and its product selection. */
@Injectable()
export class ConnectionRulesService {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly records: ChannelConnectionRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  /** Saves the rule (null removes it). Listings get the new prices on their next sync. */
  async updatePricing(
    workspaceId: string,
    connectionId: string,
    rule: PricingRule | null,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    const pricing = rule === null ? null : this.validate(() => pricingRuleSchema.parse(rule));
    const saved = await this.view(
      workspaceId,
      await this.records.savePricing(workspaceId, connectionId, pricing),
    );
    await this.record(workspaceId, saved, actor, {
      action: ActivityAction.ChannelPricingUpdated,
      detail: describePricingRule(pricing),
    });
    return saved;
  }

  /** Saves the selection (null: no automatic rule, only products added by hand). Sync now applies it. */
  async updateSelection(
    workspaceId: string,
    connectionId: string,
    rule: ProductSelectionRule | null,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    const productSelection =
      rule === null ? null : this.validate(() => productSelectionRuleSchema.parse(rule));
    const saved = await this.view(
      workspaceId,
      await this.records.saveProductSelection(workspaceId, connectionId, productSelection),
    );
    await this.record(workspaceId, saved, actor, {
      action: ActivityAction.ChannelSelectionUpdated,
      detail: productSelection ? undefined : SELECTION_CLEARED,
    });
    return saved;
  }

  /**
   * Records products removed from the store by hand (`exclude`) or added back (`restore`), so the
   * automatic rule cannot bring them back. The selection is changed under a row lock, so
   * concurrent removals all count. The caller logs the change per product.
   */
  async changeExclusions(
    workspaceId: string,
    connectionId: string,
    change: { exclude?: string[]; restore?: string[] },
  ): Promise<void> {
    const saved = await this.records.updateProductSelection(workspaceId, connectionId, (stored) =>
      this.withExclusions(this.parseStoredSelection(stored), change),
    );
    if (!saved) {
      throw new NotFoundException(CONNECTION_NOT_FOUND);
    }
  }

  private withExclusions(
    productSelection: ProductSelectionRule | null,
    change: { exclude?: string[]; restore?: string[] },
  ): ProductSelectionRule {
    const restored = new Set(change.restore ?? []);
    const excluded = [
      ...new Set([...(productSelection?.excludeProductIds ?? []), ...(change.exclude ?? [])]),
    ].filter((productId) => !restored.has(productId));
    const rule = productSelection ?? NO_AUTOMATIC_RULE;
    return this.validate(() =>
      productSelectionRuleSchema.parse({
        ...rule,
        includeProductIds: rule.includeProductIds.filter((productId) => !restored.has(productId)),
        excludeProductIds: excluded,
      }),
    );
  }

  /** The stored selection, validated like every settings read; absent or null means none. */
  private parseStoredSelection(stored: unknown): ProductSelectionRule | null {
    return stored === undefined || stored === null
      ? null
      : productSelectionRuleSchema.parse(stored);
  }

  /** The saved connection as the API shows it; null means it is not in this workspace. */
  private async view(
    workspaceId: string,
    saved: ChannelConnectionRecord | null,
  ): Promise<ChannelConnectionView> {
    if (!saved) {
      throw new NotFoundException(CONNECTION_NOT_FOUND);
    }
    return this.connections.get(workspaceId, saved.id);
  }

  private validate<TRule>(parse: () => TRule): TRule {
    try {
      return parse();
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  private record(
    workspaceId: string,
    connection: ChannelConnectionView,
    actor: Actor,
    { action, detail }: Pick<ActivityEntry, 'action' | 'detail'>,
  ): Promise<void> {
    return this.activity.record(workspaceId, actor, {
      action,
      subject: {
        type: ActivitySubjectType.ChannelConnection,
        id: connection.id,
        label: connection.displayName,
      },
      detail,
    });
  }
}
