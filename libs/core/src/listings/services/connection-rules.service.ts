import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ActivityEntry } from '../../activity/entities/activity-entry.js';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { CONNECTION_NOT_FOUND } from '../../channels/channels.constants.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import {
  type ConnectionSettings,
  serializeConnectionSettings,
} from '../../channels/entities/connection-settings.js';
import { type PricingRule, pricingRuleSchema } from '../../channels/entities/pricing-rule.js';
import {
  type ProductSelectionRule,
  productSelectionRuleSchema,
} from '../../channels/entities/product-selection.js';
import { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { describePricingRule } from '../rules/describe-pricing-rule.js';

const SELECTION_CLEARED = 'every product';

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
    const saved = await this.save(workspaceId, connectionId, { pricing });
    await this.record(workspaceId, saved, actor, {
      action: ActivityAction.ChannelPricingUpdated,
      detail: describePricingRule(pricing),
    });
    return saved;
  }

  /** Saves the selection (null selects every product). "Sync now" applies it to listings. */
  async updateSelection(
    workspaceId: string,
    connectionId: string,
    rule: ProductSelectionRule | null,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    const productSelection =
      rule === null ? null : this.validate(() => productSelectionRuleSchema.parse(rule));
    const saved = await this.save(workspaceId, connectionId, { productSelection });
    await this.record(workspaceId, saved, actor, {
      action: ActivityAction.ChannelSelectionUpdated,
      detail: productSelection ? undefined : SELECTION_CLEARED,
    });
    return saved;
  }

  private async save(
    workspaceId: string,
    connectionId: string,
    change: Partial<ConnectionSettings>,
  ): Promise<ChannelConnectionView> {
    const current = await this.connections.get(workspaceId, connectionId);
    const settings = serializeConnectionSettings({ ...current.settings, ...change });
    const saved = await this.records.saveSettings(workspaceId, connectionId, settings);
    if (!saved) {
      throw new NotFoundException(CONNECTION_NOT_FOUND);
    }
    return this.connections.get(workspaceId, connectionId);
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
