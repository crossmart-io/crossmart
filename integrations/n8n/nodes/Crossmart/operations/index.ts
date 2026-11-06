import { NodeOperationError } from 'n8n-workflow';
import type { INode } from 'n8n-workflow';
import { isEnumValue } from '../../shared/parameter-reader';
import {
	InventoryOperation,
	ListingOperation,
	OrderOperation,
	ProductOperation,
	Resource,
	StoreOperation,
} from '../crossmart.node.enums';
import { inventoryOperations } from './inventory.operations';
import { listingOperations } from './listing.operations';
import type { OperationHandler } from './operation.types';
import { orderOperations } from './order.operations';
import { productOperations } from './product.operations';
import { storeOperations } from './store.operations';

type ResourceOperations = {
	operations: Record<string, string>;
	handlers: Record<string, OperationHandler>;
};

const RESOURCES: Record<Resource, ResourceOperations> = {
	[Resource.Inventory]: { operations: InventoryOperation, handlers: inventoryOperations },
	[Resource.Listing]: { operations: ListingOperation, handlers: listingOperations },
	[Resource.Order]: { operations: OrderOperation, handlers: orderOperations },
	[Resource.Product]: { operations: ProductOperation, handlers: productOperations },
	[Resource.Store]: { operations: StoreOperation, handlers: storeOperations },
};

/** The handler of a resource's operation, or an error naming what the node does not support. */
export function resolveOperation(
	node: INode,
	resource: string,
	operation: string,
): OperationHandler {
	if (!isEnumValue(Resource, resource)) {
		throw new NodeOperationError(node, `The resource "${resource}" is not supported`);
	}
	const { operations, handlers } = RESOURCES[resource];
	if (!isEnumValue(operations, operation)) {
		throw new NodeOperationError(
			node,
			`The operation "${operation}" is not supported for "${resource}"`,
		);
	}
	return handlers[operation];
}
