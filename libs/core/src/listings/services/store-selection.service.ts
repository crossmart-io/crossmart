import { Injectable } from '@nestjs/common';
import type { Actor } from '../../activity/entities/actor.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ProductSelectionRule } from '../../channels/entities/product-selection.js';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { channelProductStateWhere } from '../rules/channel-product-state-where.js';
import { ActiveListingsGate, type PublishScope } from './active-listings.gate.js';
import { ConnectionRulesService } from './connection-rules.service.js';
import { SelectionApplier } from './selection-applier.js';

/**
 * Sets a store's automatic rule and applies it at once. A rule that would publish more active
 * listings than the plan allows is refused before it is saved, so nothing changes.
 */
@Injectable()
export class StoreSelectionService {
  constructor(
    private readonly rules: ConnectionRulesService,
    private readonly applier: SelectionApplier,
    private readonly gate: ActiveListingsGate,
  ) {}

  async update(
    store: PublishScope,
    rule: ProductSelectionRule | null,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    const { workspaceId, connectionId } = store;
    const toPublish = channelProductStateWhere({ ...store, rule }, ChannelProductState.Pending);
    await this.gate.assertRoomFor(store, toPublish);
    const saved = await this.rules.updateSelection(workspaceId, connectionId, rule, actor);
    await this.applier.applySelection(workspaceId, connectionId);
    return saved;
  }
}
