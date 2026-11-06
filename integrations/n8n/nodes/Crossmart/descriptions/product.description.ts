import type { INodeProperties } from 'n8n-workflow';
import { ProductSort, ProductStatus } from '../../shared/crossmart.enums';
import { Field, Param, ProductOperation, Resource } from '../crossmart.node.enums';
import { idField, paginationFields, showFor, sortDirectionField } from './shared.description';

/* Parameter defaults are named so n8n's linter can read them. */
const DEFAULT_OPERATION = ProductOperation.GetMany;
const DEFAULT_STATUS = ProductStatus.Draft;
const DEFAULT_SORT = ProductSort.Title;
const DEFAULT_STATUS_FILTER = ProductStatus.Active;

const PRODUCT_STATUS_OPTIONS = [
	{ name: 'Active', value: ProductStatus.Active },
	{ name: 'Archived', value: ProductStatus.Archived },
	{ name: 'Draft', value: ProductStatus.Draft },
];

const productOperation: INodeProperties = {
	displayName: 'Operation',
	name: Param.Operation,
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: [Resource.Product] } },
	options: [
		{ name: 'Create', value: ProductOperation.Create, action: 'Create a product' },
		{ name: 'Delete', value: ProductOperation.Delete, action: 'Delete a product' },
		{ name: 'Get', value: ProductOperation.Get, action: 'Get a product' },
		{ name: 'Get Many', value: ProductOperation.GetMany, action: 'Get many products' },
		{ name: 'Update', value: ProductOperation.Update, action: 'Update a product' },
	],
	default: DEFAULT_OPERATION,
};

/** Fields that create and update both offer, sorted by display name. */
const contentFields: INodeProperties[] = [
	{
		displayName: 'Description (HTML)',
		name: Field.DescriptionHtml,
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
	},
	{
		displayName: 'Handle',
		name: Field.Handle,
		type: 'string',
		default: '',
		description: 'The URL slug. Made from the title when left empty.',
	},
	{
		displayName: 'Option Names',
		name: Field.OptionNames,
		type: 'string',
		default: '',
		placeholder: 'Size, Color',
		description: 'Comma-separated names of the options variants differ by',
	},
	{ displayName: 'Product Type', name: Field.ProductType, type: 'string', default: '' },
	{
		displayName: 'Status',
		name: Field.Status,
		type: 'options',
		options: PRODUCT_STATUS_OPTIONS,
		default: DEFAULT_STATUS,
	},
	{
		displayName: 'Tags',
		name: Field.Tags,
		type: 'string',
		default: '',
		description: 'Comma-separated tags',
	},
];

const titleField: INodeProperties = {
	displayName: 'Title',
	name: Field.Title,
	type: 'string',
	default: '',
};

const vendorField: INodeProperties = {
	displayName: 'Vendor',
	name: Field.Vendor,
	type: 'string',
	default: '',
};

const productIdField = idField(
	Resource.Product,
	[ProductOperation.Delete, ProductOperation.Get, ProductOperation.Update],
	{ name: Param.ProductId, displayName: 'Product ID', description: 'The ID of the product' },
);

const createFields: INodeProperties[] = [
	{
		displayName: 'Title',
		name: Param.Title,
		type: 'string',
		required: true,
		displayOptions: showFor(Resource.Product, [ProductOperation.Create]),
		default: '',
	},
	{
		displayName: 'Variants',
		name: Param.Variants,
		type: 'fixedCollection',
		placeholder: 'Add Variant',
		typeOptions: { multipleValues: true },
		displayOptions: showFor(Resource.Product, [ProductOperation.Create]),
		default: {},
		description:
			'A product has at least one variant: the version that is sold, with its own SKU, price and stock',
		options: [
			{
				displayName: 'Variant',
				name: Field.Variant,
				values: [
					{
						displayName: 'Compare-At Price',
						name: Field.CompareAtPrice,
						type: 'string',
						default: '',
						placeholder: '24.00',
						description: 'The original price, shown struck through',
					},
					{
						displayName: 'Option Values',
						name: Field.OptionValues,
						type: 'string',
						default: '',
						placeholder: 'M, Blue',
						description: 'Comma-separated values, in the order of the product’s option names',
					},
					{
						displayName: 'Price',
						name: Field.Price,
						type: 'string',
						default: '',
						placeholder: '19.90',
						description: 'A decimal amount in the workspace’s currency',
					},
					{
						displayName: 'Quantity',
						name: Field.Quantity,
						type: 'number',
						default: 0,
						description: 'The opening stock',
					},
					{ displayName: 'SKU', name: Field.Sku, type: 'string', default: '' },
				],
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: Param.AdditionalFields,
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: showFor(Resource.Product, [ProductOperation.Create]),
		default: {},
		options: [...contentFields, vendorField],
	},
];

const updateFields: INodeProperties = {
	displayName: 'Update Fields',
	name: Param.UpdateFields,
	type: 'collection',
	placeholder: 'Add Field',
	displayOptions: showFor(Resource.Product, [ProductOperation.Update]),
	default: {},
	description:
		'Fields to change. The rest of the product, including its variants, stock and images, stays as it is.',
	options: [...contentFields, titleField, vendorField],
};

const getManyFilters: INodeProperties = {
	displayName: 'Filters',
	name: Param.Filters,
	type: 'collection',
	placeholder: 'Add Filter',
	displayOptions: showFor(Resource.Product, [ProductOperation.GetMany]),
	default: {},
	options: [
		{
			displayName: 'Search',
			name: Field.Search,
			type: 'string',
			default: '',
			description: 'Matches the title, handle or SKU',
		},
		{
			displayName: 'Sort By',
			name: Field.Sort,
			type: 'options',
			options: [
				{ name: 'Created At', value: ProductSort.CreatedAt },
				{ name: 'Title', value: ProductSort.Title },
				{ name: 'Updated At', value: ProductSort.UpdatedAt },
			],
			default: DEFAULT_SORT,
		},
		sortDirectionField,
		{
			displayName: 'Status',
			name: Field.Status,
			type: 'options',
			options: PRODUCT_STATUS_OPTIONS,
			default: DEFAULT_STATUS_FILTER,
		},
		{
			displayName: 'Tags',
			name: Field.Tags,
			type: 'string',
			default: '',
			description: 'Comma-separated tags; products with any of them match',
		},
		vendorField,
	],
};

export const productDescription: INodeProperties[] = [
	productOperation,
	productIdField,
	...createFields,
	updateFields,
	...paginationFields(Resource.Product, ProductOperation.GetMany),
	getManyFilters,
];
