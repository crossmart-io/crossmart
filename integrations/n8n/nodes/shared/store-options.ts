import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { ApiPath } from './api-paths';
import { CrossmartClient } from './crossmart-client';
import type { Store } from './crossmart.types';

/** A store as a dropdown option: its name and channel, with its id as the value. */
export function toStoreOption(store: Store): INodePropertyOptions {
	return { name: `${store.displayName} (${store.channel})`, value: store.id };
}

/** Fills a store dropdown with the workspace's stores. */
export async function getStores(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const client = await CrossmartClient.fromContext(this);
	const stores = await client.get<Store[]>(ApiPath.stores);
	return stores.map(toStoreOption);
}
