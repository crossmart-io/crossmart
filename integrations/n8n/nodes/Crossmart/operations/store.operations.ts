import type { IDataObject } from 'n8n-workflow';
import { ApiPath } from '../../shared/api-paths';
import type { WorkspacePath } from '../../shared/crossmart-client';
import { HttpMethod } from '../../shared/crossmart.enums';
import { Param, StoreOperation } from '../crossmart.node.enums';
import type { OperationContext, OperationMap } from './operation.types';

type StoreRoute = (workspaceId: string, connectionId: string) => string;

function storePath({ params }: OperationContext, route: StoreRoute): WorkspacePath {
	const connectionId = params.string(Param.ConnectionId);
	return (workspaceId) => route(workspaceId, connectionId);
}

async function getManyStores({ client }: OperationContext): Promise<IDataObject[]> {
	return client.get<IDataObject[]>(ApiPath.stores);
}

async function getStore(context: OperationContext): Promise<IDataObject> {
	return context.client.get<IDataObject>(storePath(context, ApiPath.store));
}

/** Publishes the store's selected products and updates what changed, in the background. */
async function syncStore(context: OperationContext): Promise<IDataObject> {
	return context.client.send<IDataObject>(HttpMethod.Post, storePath(context, ApiPath.storeSync));
}

async function getSyncProgress(context: OperationContext): Promise<IDataObject> {
	return context.client.get<IDataObject>(storePath(context, ApiPath.storeSync));
}

export const storeOperations: OperationMap<StoreOperation> = {
	[StoreOperation.Get]: getStore,
	[StoreOperation.GetMany]: getManyStores,
	[StoreOperation.GetSyncProgress]: getSyncProgress,
	[StoreOperation.Sync]: syncStore,
};
