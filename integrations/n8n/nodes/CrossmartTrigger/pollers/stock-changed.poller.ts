import type { IDataObject } from 'n8n-workflow';
import { ApiPath } from '../../shared/api-paths';
import { MAX_PAGE_SIZE } from '../../shared/crossmart.constants';
import { InventorySort, SortDirection } from '../../shared/crossmart.enums';
import type { InventoryItem } from '../../shared/crossmart.types';
import type { CrossmartClient } from '../../shared/crossmart-client';
import { MAX_PAGES_PER_POLL, SAMPLE_SIZE } from '../crossmart-trigger.constants';
import { advanceWatermark, isAfterWatermark, type Timestamped, type Watermark } from '../dedupe';
import type { PollContext, Poller } from './poller.types';

const RECENTLY_UPDATED_FIRST = { sort: InventorySort.UpdatedAt, direction: SortDirection.Desc };

const timestamped = (item: InventoryItem): Timestamped => ({
	id: item.inventoryItemId,
	updatedAt: item.updatedAt,
});

/**
 * Emits inventory items whose stock changed. The inventory lists most recently updated first, so
 * the poller reads until it reaches the last change it emitted (its watermark).
 */
export class StockChangedPoller implements Poller {
	async poll({ client, state }: PollContext): Promise<IDataObject[]> {
		const watermark = state.watermark();
		if (watermark === undefined || !state.initialized) {
			const latest = await this.latest(client, SAMPLE_SIZE);
			state.setWatermark(advanceWatermark(undefined, latest.map(timestamped)));
			state.markInitialized();
			return [];
		}
		const changed = await this.changedSince(client, watermark);
		state.setWatermark(advanceWatermark(watermark, changed.map(timestamped)));
		return changed.reverse();
	}

	async sample({ client }: PollContext): Promise<IDataObject[]> {
		return this.latest(client, SAMPLE_SIZE);
	}

	private async latest(client: CrossmartClient, limit: number): Promise<InventoryItem[]> {
		const page = await client.getPage<InventoryItem>(ApiPath.inventoryItems, {
			...RECENTLY_UPDATED_FIRST,
			limit,
		});
		return page.items;
	}

	private async changedSince(
		client: CrossmartClient,
		watermark: Watermark,
	): Promise<InventoryItem[]> {
		const changed: InventoryItem[] = [];
		let cursor: string | undefined;
		for (let pageCount = 0; pageCount < MAX_PAGES_PER_POLL; pageCount++) {
			const page = await client.getPage<InventoryItem>(ApiPath.inventoryItems, {
				...RECENTLY_UPDATED_FIRST,
				limit: MAX_PAGE_SIZE,
				cursor,
			});
			const newer = page.items.filter((item) => isAfterWatermark(timestamped(item), watermark));
			changed.push(...newer);
			cursor = page.nextCursor ?? undefined;
			if (newer.length < page.items.length || cursor === undefined) break;
		}
		return changed;
	}
}
