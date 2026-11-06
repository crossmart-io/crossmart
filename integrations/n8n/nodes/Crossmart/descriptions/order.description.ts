import type { INodeProperties } from 'n8n-workflow';
import { EXPRESSION_HINT } from '../../shared/crossmart.constants';
import { LoadOptionsMethod, OrderStatus } from '../../shared/crossmart.enums';
import { Field, OrderOperation, Param, Resource } from '../crossmart.node.enums';
import { idField, paginationFields, showFor, sortDirectionField } from './shared.description';

/* Parameter defaults are named so n8n's linter can read them. */
const DEFAULT_OPERATION = OrderOperation.GetMany;
const DEFAULT_STATUS_FILTER = OrderStatus.Open;

const orderOperation: INodeProperties = {
	displayName: 'Operation',
	name: Param.Operation,
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: [Resource.Order] } },
	options: [
		{
			name: 'Get',
			value: OrderOperation.Get,
			description: 'Get an order with its lines',
			action: 'Get an order',
		},
		{
			name: 'Get Many',
			value: OrderOperation.GetMany,
			description: 'Get orders from every connected store, newest first',
			action: 'Get many orders',
		},
	],
	default: DEFAULT_OPERATION,
};

const orderIdField = idField(Resource.Order, [OrderOperation.Get], {
	name: Param.OrderId,
	displayName: 'Order ID',
	description: 'The Crossmart ID of the order',
});

const getManyFilters: INodeProperties = {
	displayName: 'Filters',
	name: Param.Filters,
	type: 'collection',
	placeholder: 'Add Filter',
	displayOptions: showFor(Resource.Order, [OrderOperation.GetMany]),
	default: {},
	options: [
		{
			displayName: 'Search',
			name: Field.Search,
			type: 'string',
			default: '',
			description: 'Matches the order number',
		},
		{ ...sortDirectionField, displayName: 'Sort Direction (by Date Placed)' },
		{
			displayName: 'Status',
			name: Field.Status,
			type: 'options',
			options: [
				{ name: 'Cancelled', value: OrderStatus.Cancelled },
				{ name: 'Fulfilled', value: OrderStatus.Fulfilled },
				{ name: 'Open', value: OrderStatus.Open },
				{ name: 'Partially Fulfilled', value: OrderStatus.PartiallyFulfilled },
			],
			default: DEFAULT_STATUS_FILTER,
		},
		{
			displayName: 'Store Name or ID',
			name: Field.ConnectionId,
			type: 'options',
			typeOptions: { loadOptionsMethod: LoadOptionsMethod.GetStores },
			default: '',
			description: EXPRESSION_HINT,
		},
	],
};

export const orderDescription: INodeProperties[] = [
	orderOperation,
	orderIdField,
	...paginationFields(Resource.Order, OrderOperation.GetMany),
	getManyFilters,
];
