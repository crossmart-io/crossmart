import { BadRequestException, Injectable } from '@nestjs/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { PRODUCT_NOT_FOUND_IN_WORKSPACE } from '../listings.constants.js';
import { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import { type StoreMembershipChange, StoreMembershipWriter } from './store-membership.writer.js';

export type { StoreMembershipChange } from './store-membership.writer.js';

interface MembershipLog {
  action: ActivityAction;
  store: string;
  products: { id: string; title: string }[];
}

/**
 * Adds products to a store by hand, or removes them. Added products stay until removed, whatever
 * the automatic rule says, and are published at once; removed ones are delisted at once.
 */
@Injectable()
export class StoreMembershipService {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly products: ProductSelectionRepository,
    private readonly writer: StoreMembershipWriter,
    private readonly activity: ActivityRecorder,
  ) {}

  async add(change: StoreMembershipChange, actor: Actor): Promise<void> {
    const log = await this.load(change, ActivityAction.ListingAdded);
    await this.writer.add(change);
    await this.record(change.workspaceId, actor, log);
  }

  async remove(change: StoreMembershipChange, actor: Actor): Promise<void> {
    const log = await this.load(change, ActivityAction.ListingRemoved);
    await this.writer.remove(change);
    await this.record(change.workspaceId, actor, log);
  }

  /** The store and the products, which must all belong to the workspace. */
  private async load(
    change: StoreMembershipChange,
    action: ActivityAction,
  ): Promise<MembershipLog> {
    const store = await this.connections.get(change.workspaceId, change.connectionId);
    const products = await this.products.findTitles(change.workspaceId, change.productIds);
    if (products.length !== new Set(change.productIds).size) {
      throw new BadRequestException(PRODUCT_NOT_FOUND_IN_WORKSPACE);
    }
    return { action, store: store.displayName, products };
  }

  private async record(workspaceId: string, actor: Actor, log: MembershipLog): Promise<void> {
    for (const product of log.products) {
      await this.activity.record(workspaceId, actor, {
        action: log.action,
        subject: { type: ActivitySubjectType.Product, id: product.id, label: product.title },
        detail: log.store,
      });
    }
  }
}
