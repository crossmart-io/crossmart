import type { INodeProperties } from 'n8n-workflow';
import { Param, Resource, StoreOperation } from '../crossmart.node.enums';
import { storeField } from './shared.description';

/* Parameter defaults are named so n8n's linter can read them. */
const DEFAULT_OPERATION = StoreOperation.GetMany;

const storeOperation: INodeProperties = {
	displayName: 'Operation',
	name: Param.Operation,
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: [Resource.Store] } },
	options: [
		{
			name: 'Get',
			value: StoreOperation.Get,
			description: 'Get a connected store',
			action: 'Get a store',
		},
		{
			name: 'Get Many',
			value: StoreOperation.GetMany,
			description: 'Get every store of the workspace, with its status and failed listing count',
			action: 'Get many stores',
		},
		{
			name: 'Get Sync Progress',
			value: StoreOperation.GetSyncProgress,
			description: 'Get how far the store’s sync has come',
			action: 'Get the sync progress of a store',
		},
		{
			name: 'Sync',
			value: StoreOperation.Sync,
			description:
				'Publish the store’s selected products and update what changed, in the background',
			action: 'Sync a store',
		},
	],
	default: DEFAULT_OPERATION,
};

export const storeDescription: INodeProperties[] = [
	storeOperation,
	storeField(Resource.Store, [
		StoreOperation.Get,
		StoreOperation.GetSyncProgress,
		StoreOperation.Sync,
	]),
];
