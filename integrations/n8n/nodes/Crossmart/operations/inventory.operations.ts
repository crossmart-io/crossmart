import type { IDataObject } from 'n8n-workflow';
import { ApiPath } from '../../shared/api-paths';
import {
	HttpMethod,
	InventorySort,
	ManualMovementReason,
	SortDirection,
	StockAdjustmentMode,
	StockLevel,
} from '../../shared/crossmart.enums';
import type { InventoryItem } from '../../shared/crossmart.types';
import { enumField, stringField } from '../../shared/parameter-reader';
import { Field, InventoryOperation, Param } from '../crossmart.node.enums';
import { listItems } from './list-items';
import type { OperationContext, OperationMap } from './operation.types';

async function getManyItems(context: OperationContext): Promise<IDataObject[]> {
	const filters = context.params.collection(Param.Filters);
	return listItems(context, ApiPath.inventoryItems, {
		search: stringField(filters, Field.Search),
		stockLevel: enumField(filters, Field.StockLevel, StockLevel),
		sort: enumField(filters, Field.Sort, InventorySort),
		direction: enumField(filters, Field.Direction, SortDirection),
	});
}

/**
 * The inventory items whose SKU is exactly `sku`. The API has no lookup by SKU, so this searches
 * (which also matches titles and partial SKUs) and keeps the exact matches.
 */
async function getItemsBySku({ client, params }: OperationContext): Promise<InventoryItem[]> {
	const sku = params.string(Param.Sku).trim();
	const matches = await client.getAll<InventoryItem>(ApiPath.inventoryItems, { search: sku });
	return matches.filter((item) => item.sku === sku);
}

async function getItemHistory(context: OperationContext): Promise<IDataObject[]> {
	const inventoryItemId = context.params.string(Param.InventoryItemId);
	return listItems(context, (workspaceId) =>
		ApiPath.inventoryMovements(workspaceId, inventoryItemId),
	);
}

async function adjustStock({ client, params }: OperationContext): Promise<IDataObject> {
	const inventoryItemId = params.string(Param.InventoryItemId);
	const body: IDataObject = {
		mode: params.enumValue(Param.Mode, StockAdjustmentMode),
		quantity: params.number(Param.Quantity),
		reason: params.enumValue(Param.Reason, ManualMovementReason),
		note: stringField(params.collection(Param.AdditionalFields), Field.Note),
	};
	return client.send<IDataObject>(
		HttpMethod.Post,
		(workspaceId) => ApiPath.inventoryAdjustments(workspaceId, inventoryItemId),
		body,
	);
}

export const inventoryOperations: OperationMap<InventoryOperation> = {
	[InventoryOperation.Adjust]: adjustStock,
	[InventoryOperation.GetBySku]: getItemsBySku,
	[InventoryOperation.GetHistory]: getItemHistory,
	[InventoryOperation.GetMany]: getManyItems,
};
