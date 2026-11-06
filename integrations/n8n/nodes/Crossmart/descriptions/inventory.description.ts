import type { INodeProperties } from 'n8n-workflow';
import {
	InventorySort,
	ManualMovementReason,
	StockAdjustmentMode,
	StockLevel,
} from '../../shared/crossmart.enums';
import { Field, InventoryOperation, Param, Resource } from '../crossmart.node.enums';
import { idField, paginationFields, showFor, sortDirectionField } from './shared.description';

/* Parameter defaults are named so n8n's linter can read them. */
const DEFAULT_OPERATION = InventoryOperation.GetMany;
const DEFAULT_MODE = StockAdjustmentMode.Delta;
const DEFAULT_REASON = ManualMovementReason.Received;
const DEFAULT_SORT = InventorySort.Title;
const DEFAULT_STOCK_LEVEL = StockLevel.LowStock;

const inventoryOperation: INodeProperties = {
	displayName: 'Operation',
	name: Param.Operation,
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: [Resource.Inventory] } },
	options: [
		{
			name: 'Adjust Stock',
			value: InventoryOperation.Adjust,
			description: 'Add, remove or set a variant’s stock, with a reason',
			action: 'Adjust stock',
		},
		{
			name: 'Get by SKU',
			value: InventoryOperation.GetBySku,
			description: 'Get the stock of the variant with this exact SKU',
			action: 'Get stock by SKU',
		},
		{
			name: 'Get History',
			value: InventoryOperation.GetHistory,
			description: 'Get a variant’s stock movements, newest first',
			action: 'Get stock history',
		},
		{
			name: 'Get Many',
			value: InventoryOperation.GetMany,
			description: 'Get the stock of many variants',
			action: 'Get many inventory items',
		},
	],
	default: DEFAULT_OPERATION,
};

const inventoryItemIdField = idField(
	Resource.Inventory,
	[InventoryOperation.Adjust, InventoryOperation.GetHistory],
	{
		name: Param.InventoryItemId,
		displayName: 'Inventory Item ID',
		description:
			'The `inventoryItemId` of the variant’s stock, as "Get Many" or "Get by SKU" return it',
	},
);

const skuField = idField(Resource.Inventory, [InventoryOperation.GetBySku], {
	name: Param.Sku,
	displayName: 'SKU',
	description: 'The exact SKU of the variant',
});

const adjustFields: INodeProperties[] = [
	{
		displayName: 'Mode',
		name: Param.Mode,
		type: 'options',
		displayOptions: showFor(Resource.Inventory, [InventoryOperation.Adjust]),
		options: [
			{
				name: 'Add or Remove',
				value: StockAdjustmentMode.Delta,
				description: 'Add the quantity, or remove it when negative',
			},
			{
				name: 'Set',
				value: StockAdjustmentMode.Set,
				description: 'Replace the stock on hand with the quantity, as after a count',
			},
		],
		default: DEFAULT_MODE,
	},
	{
		displayName: 'Quantity',
		name: Param.Quantity,
		type: 'number',
		required: true,
		displayOptions: showFor(Resource.Inventory, [InventoryOperation.Adjust]),
		default: 0,
	},
	{
		displayName: 'Reason',
		name: Param.Reason,
		type: 'options',
		displayOptions: showFor(Resource.Inventory, [InventoryOperation.Adjust]),
		options: [
			{ name: 'Correction', value: ManualMovementReason.Correction },
			{ name: 'Damaged', value: ManualMovementReason.Damaged },
			{ name: 'Lost', value: ManualMovementReason.Lost },
			{ name: 'Received', value: ManualMovementReason.Received },
			{ name: 'Returned', value: ManualMovementReason.Returned },
			{
				name: 'Sold',
				value: ManualMovementReason.Sold,
				description: 'Sold outside a connected store, such as at a market stall',
			},
		],
		default: DEFAULT_REASON,
		description: 'Recorded in the stock history',
	},
	{
		displayName: 'Additional Fields',
		name: Param.AdditionalFields,
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: showFor(Resource.Inventory, [InventoryOperation.Adjust]),
		default: {},
		options: [
			{
				displayName: 'Note',
				name: Field.Note,
				type: 'string',
				default: '',
				placeholder: 'PO 1042',
			},
		],
	},
];

const getManyFilters: INodeProperties = {
	displayName: 'Filters',
	name: Param.Filters,
	type: 'collection',
	placeholder: 'Add Filter',
	displayOptions: showFor(Resource.Inventory, [InventoryOperation.GetMany]),
	default: {},
	options: [
		{
			displayName: 'Search',
			name: Field.Search,
			type: 'string',
			default: '',
			description: 'Matches the SKU or the product title',
		},
		{
			displayName: 'Sort By',
			name: Field.Sort,
			type: 'options',
			options: [
				{ name: 'Available', value: InventorySort.Available },
				{ name: 'Title', value: InventorySort.Title },
				{ name: 'Updated At', value: InventorySort.UpdatedAt },
			],
			default: DEFAULT_SORT,
		},
		sortDirectionField,
		{
			displayName: 'Stock Level',
			name: Field.StockLevel,
			type: 'options',
			options: [
				{ name: 'In Stock', value: StockLevel.InStock },
				{ name: 'Low Stock', value: StockLevel.LowStock },
				{ name: 'Out of Stock', value: StockLevel.OutOfStock },
				{ name: 'Untracked', value: StockLevel.Untracked },
			],
			default: DEFAULT_STOCK_LEVEL,
		},
	],
};

export const inventoryDescription: INodeProperties[] = [
	inventoryOperation,
	inventoryItemIdField,
	skuField,
	...adjustFields,
	...paginationFields(Resource.Inventory, InventoryOperation.GetHistory),
	...paginationFields(Resource.Inventory, InventoryOperation.GetMany),
	getManyFilters,
];
