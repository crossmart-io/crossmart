import type { INodeProperties } from 'n8n-workflow';
import { ListingStatus } from '../../shared/crossmart.enums';
import { Field, ListingOperation, Param, Resource } from '../crossmart.node.enums';
import { idField, paginationFields, showFor, storeField } from './shared.description';

/* Parameter defaults are named so n8n's linter can read them. */
const DEFAULT_OPERATION = ListingOperation.GetForProduct;
const DEFAULT_STATUS_FILTER = ListingStatus.Error;

const PER_PRODUCT_OPERATIONS = [
	ListingOperation.Publish,
	ListingOperation.Retry,
	ListingOperation.Unpublish,
];

const listingOperation: INodeProperties = {
	displayName: 'Operation',
	name: Param.Operation,
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: [Resource.Listing] } },
	options: [
		{
			name: 'Get for Product',
			value: ListingOperation.GetForProduct,
			description:
				'Get a product’s state on every store: listing status, errors, override and prices',
			action: 'Get a product s listings',
		},
		{
			name: 'Get Many for Store',
			value: ListingOperation.GetManyForStore,
			description: 'Get a store’s listings, most recently changed first',
			action: 'Get many listings of a store',
		},
		{
			name: 'Publish',
			value: ListingOperation.Publish,
			description: 'Add a product to a store; it is published there in the background',
			action: 'Publish a product to a store',
		},
		{
			name: 'Retry',
			value: ListingOperation.Retry,
			description: 'Publish a product to one store again, such as after a failed publish',
			action: 'Retry a listing',
		},
		{
			name: 'Unpublish',
			value: ListingOperation.Unpublish,
			description: 'Remove a product from a store; it is delisted there',
			action: 'Unpublish a product from a store',
		},
	],
	default: DEFAULT_OPERATION,
};

const productIdField = idField(
	Resource.Listing,
	[ListingOperation.GetForProduct, ...PER_PRODUCT_OPERATIONS],
	{ name: Param.ProductId, displayName: 'Product ID', description: 'The ID of the product' },
);

const getManyFilters: INodeProperties = {
	displayName: 'Filters',
	name: Param.Filters,
	type: 'collection',
	placeholder: 'Add Filter',
	displayOptions: showFor(Resource.Listing, [ListingOperation.GetManyForStore]),
	default: {},
	options: [
		{
			displayName: 'Status',
			name: Field.Status,
			type: 'options',
			options: [
				{ name: 'Active', value: ListingStatus.Active },
				{ name: 'Delisted', value: ListingStatus.Delisted },
				{ name: 'Error', value: ListingStatus.Error },
				{ name: 'Inactive', value: ListingStatus.Inactive },
				{ name: 'Pending', value: ListingStatus.Pending },
			],
			default: DEFAULT_STATUS_FILTER,
		},
	],
};

export const listingDescription: INodeProperties[] = [
	listingOperation,
	productIdField,
	storeField(Resource.Listing, [ListingOperation.GetManyForStore, ...PER_PRODUCT_OPERATIONS]),
	...paginationFields(Resource.Listing, ListingOperation.GetManyForStore),
	getManyFilters,
];
