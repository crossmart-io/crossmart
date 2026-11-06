import type { IDataObject } from 'n8n-workflow';
import { ApiPath } from '../../shared/api-paths';
import { MAX_PAGE_SIZE } from '../../shared/crossmart.constants';
import { SortDirection } from '../../shared/crossmart.enums';
import type { OrderSummary, Page } from '../../shared/crossmart.types';
import type { QueryParams } from '../../shared/request-options';
import { MAX_PAGES_PER_POLL, SAMPLE_SIZE } from '../crossmart-trigger.constants';
import { StateKey } from '../crossmart-trigger.enums';
import { rememberIds, selectUnseen } from '../dedupe';
import type { PollContext, Poller } from './poller.types';

const orderId = (order: OrderSummary): string => order.id;

/**
 * Emits orders it has not seen. Orders list newest first (by date placed) and the API has no
 * "created since" filter, so the poller reads pages until it reaches orders it already saw.
 */
export class NewOrderPoller implements Poller {
	async poll({ client, state, connectionId }: PollContext): Promise<IDataObject[]> {
		const seenIds = state.stringList(StateKey.SeenIds);
		const { fresh, fetched } = await this.readUntilSeen(
			client,
			this.query(connectionId),
			seenIds,
			state.initialized,
		);
		state.setStringList(StateKey.SeenIds, rememberIds(seenIds, fetched.map(orderId)));
		if (!state.initialized) {
			state.markInitialized();
			return [];
		}
		return fresh.reverse();
	}

	async sample({ client, connectionId }: PollContext): Promise<IDataObject[]> {
		const page = await client.getPage<OrderSummary>(ApiPath.orders, {
			...this.query(connectionId),
			limit: SAMPLE_SIZE,
		});
		return page.items;
	}

	private query(connectionId: string | undefined): QueryParams {
		return { connectionId, direction: SortDirection.Desc, limit: MAX_PAGE_SIZE };
	}

	/** Reads pages while every order on them is new; the first poll reads one page only. */
	private async readUntilSeen(
		client: PollContext['client'],
		query: QueryParams,
		seenIds: string[],
		initialized: boolean,
	): Promise<{ fresh: OrderSummary[]; fetched: OrderSummary[] }> {
		const fresh: OrderSummary[] = [];
		const fetched: OrderSummary[] = [];
		let cursor: string | undefined;
		for (let pageCount = 0; pageCount < MAX_PAGES_PER_POLL; pageCount++) {
			const page: Page<OrderSummary> = await client.getPage<OrderSummary>(ApiPath.orders, {
				...query,
				cursor,
			});
			const unseen = selectUnseen(page.items, seenIds, orderId);
			fetched.push(...page.items);
			fresh.push(...unseen);
			cursor = page.nextCursor ?? undefined;
			const reachedSeen = unseen.length < page.items.length;
			if (!initialized || reachedSeen || cursor === undefined) break;
		}
		return { fresh, fetched };
	}
}
