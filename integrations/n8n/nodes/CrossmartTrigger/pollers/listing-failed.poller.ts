import type { IDataObject } from 'n8n-workflow';
import { ApiPath } from '../../shared/api-paths';
import type { CrossmartClient } from '../../shared/crossmart-client';
import { ListingStatus } from '../../shared/crossmart.enums';
import type { Store, StoreListing } from '../../shared/crossmart.types';
import { SAMPLE_SIZE } from '../crossmart-trigger.constants';
import { StateKey } from '../crossmart-trigger.enums';
import { failureKey, selectNewFailures } from '../dedupe';
import type { PollContext, Poller } from './poller.types';

/** A failed listing with the store it failed on. */
export type FailedListing = StoreListing & {
	connectionId: string;
	storeName: string;
	channel: string;
};

/**
 * Emits listings that started failing since the previous poll. The API lists failed listings per
 * store, so the poller reads each store that reports failed listings.
 */
export class ListingFailedPoller implements Poller {
	async poll({ client, state, connectionId }: PollContext): Promise<IDataObject[]> {
		const failures = await this.currentFailures(client, connectionId);
		const fresh = selectNewFailures(failures, state.stringList(StateKey.FailureKeys));
		state.setStringList(StateKey.FailureKeys, failures.map(failureKey));
		if (!state.initialized) {
			state.markInitialized();
			return [];
		}
		return fresh;
	}

	async sample({ client, connectionId }: PollContext): Promise<IDataObject[]> {
		const failures = await this.currentFailures(client, connectionId);
		return failures.slice(0, SAMPLE_SIZE);
	}

	private async currentFailures(
		client: CrossmartClient,
		connectionId: string | undefined,
	): Promise<FailedListing[]> {
		const stores = await client.get<Store[]>(ApiPath.stores);
		const watched = stores.filter(
			(store) =>
				store.failedListings > 0 && (connectionId === undefined || store.id === connectionId),
		);
		const perStore = await Promise.all(watched.map((store) => this.storeFailures(client, store)));
		return perStore.flat();
	}

	private async storeFailures(client: CrossmartClient, store: Store): Promise<FailedListing[]> {
		const listings = await client.getAll<StoreListing>(
			(workspaceId) => ApiPath.storeListings(workspaceId, store.id),
			{ status: ListingStatus.Error },
		);
		return listings.map((listing) => ({
			...listing,
			connectionId: store.id,
			storeName: store.displayName,
			channel: store.channel,
		}));
	}
}
