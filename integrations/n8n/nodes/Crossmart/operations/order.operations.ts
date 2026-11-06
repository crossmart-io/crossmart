import type { IDataObject } from 'n8n-workflow';
import { ApiPath } from '../../shared/api-paths';
import { OrderStatus, SortDirection } from '../../shared/crossmart.enums';
import { enumField, stringField } from '../../shared/parameter-reader';
import { Field, OrderOperation, Param } from '../crossmart.node.enums';
import { listItems } from './list-items';
import type { OperationContext, OperationMap } from './operation.types';

async function getOrder({ client, params }: OperationContext): Promise<IDataObject> {
	const orderId = params.string(Param.OrderId);
	return client.get<IDataObject>((workspaceId) => ApiPath.order(workspaceId, orderId));
}

async function getManyOrders(context: OperationContext): Promise<IDataObject[]> {
	const filters = context.params.collection(Param.Filters);
	return listItems(context, ApiPath.orders, {
		status: enumField(filters, Field.Status, OrderStatus),
		connectionId: stringField(filters, Field.ConnectionId),
		search: stringField(filters, Field.Search),
		direction: enumField(filters, Field.Direction, SortDirection),
	});
}

export const orderOperations: OperationMap<OrderOperation> = {
	[OrderOperation.Get]: getOrder,
	[OrderOperation.GetMany]: getManyOrders,
};
