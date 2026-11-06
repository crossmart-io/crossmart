import type { IDataObject } from 'n8n-workflow';
import { ApiPath } from '../../shared/api-paths';
import {
	HttpMethod,
	ProductSort,
	ProductStatus,
	SortDirection,
} from '../../shared/crossmart.enums';
import type { Media, Product, Variant } from '../../shared/crossmart.types';
import {
	enumField,
	listField,
	numberField,
	objectListField,
	stringField,
} from '../../shared/parameter-reader';
import { Field, Param, ProductOperation } from '../crossmart.node.enums';
import { listItems } from './list-items';
import type { OperationContext, OperationMap } from './operation.types';

/** The product fields the create and update forms share, as the API names them. */
export function readProductFields(fields: IDataObject): IDataObject {
	return {
		title: stringField(fields, Field.Title),
		handle: stringField(fields, Field.Handle),
		descriptionHtml: stringField(fields, Field.DescriptionHtml),
		vendor: stringField(fields, Field.Vendor),
		productType: stringField(fields, Field.ProductType),
		status: enumField(fields, Field.Status, ProductStatus),
		tags: listField(fields, Field.Tags),
		optionNames: listField(fields, Field.OptionNames),
	};
}

/** A variant of the create form, as the API takes it. */
export function readNewVariant(variant: IDataObject): IDataObject {
	return {
		sku: stringField(variant, Field.Sku),
		price: stringField(variant, Field.Price),
		compareAtPrice: stringField(variant, Field.CompareAtPrice),
		quantity: numberField(variant, Field.Quantity),
		optionValues: listField(variant, Field.OptionValues),
	};
}

/** Removes the fields left unset, so they keep the value the request is based on. */
export function withoutUnset(fields: IDataObject): IDataObject {
	return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

/** A variant as the update request takes it. Without `quantity`, its stock stays as it is. */
function toVariantUpdate(variant: Variant): IDataObject {
	return {
		id: variant.id,
		sku: variant.sku ?? undefined,
		barcode: variant.barcode ?? undefined,
		optionValues: variant.optionValues,
		price: variant.price,
		compareAtPrice: variant.compareAtPrice ?? undefined,
		cost: variant.cost ?? undefined,
		weightGrams: variant.weightGrams ?? undefined,
		requiresShipping: variant.requiresShipping,
		taxable: variant.taxable,
		outOfStockPolicy: variant.outOfStockPolicy,
		tracked: variant.tracked,
	};
}

const toMediaUpdate = (media: Media): IDataObject => ({
	url: media.url,
	altText: media.altText ?? undefined,
});

/**
 * The full update request (the API replaces the product): the current product with the changed
 * fields on top, keeping its variants, stock and images.
 */
export function buildProductUpdate(product: Product, changes: IDataObject): IDataObject {
	return {
		title: product.title,
		handle: product.handle,
		descriptionHtml: product.descriptionHtml,
		vendor: product.vendor ?? undefined,
		productType: product.productType ?? undefined,
		tags: product.tags,
		status: product.status,
		optionNames: product.optionNames,
		media: product.media.map(toMediaUpdate),
		variants: product.variants.map(toVariantUpdate),
		...withoutUnset(changes),
	};
}

async function createProduct({ client, params }: OperationContext): Promise<IDataObject> {
	const variants = objectListField(params.collection(Param.Variants), Field.Variant);
	const body = withoutUnset({
		...readProductFields(params.collection(Param.AdditionalFields)),
		title: params.string(Param.Title),
		variants: variants.map((variant) => withoutUnset(readNewVariant(variant))),
	});
	return client.send<IDataObject>(HttpMethod.Post, ApiPath.products, body);
}

async function getProduct({ client, params }: OperationContext): Promise<IDataObject> {
	const productId = params.string(Param.ProductId);
	return client.get<IDataObject>((workspaceId) => ApiPath.product(workspaceId, productId));
}

async function getManyProducts(context: OperationContext): Promise<IDataObject[]> {
	const filters = context.params.collection(Param.Filters);
	return listItems(context, ApiPath.products, {
		search: stringField(filters, Field.Search),
		status: enumField(filters, Field.Status, ProductStatus),
		tags: listField(filters, Field.Tags),
		vendor: stringField(filters, Field.Vendor),
		sort: enumField(filters, Field.Sort, ProductSort),
		direction: enumField(filters, Field.Direction, SortDirection),
	});
}

async function updateProduct({ client, params }: OperationContext): Promise<IDataObject> {
	const productId = params.string(Param.ProductId);
	const path = (workspaceId: string): string => ApiPath.product(workspaceId, productId);
	const product = await client.get<Product>(path);
	const changes = readProductFields(params.collection(Param.UpdateFields));
	return client.send<IDataObject>(HttpMethod.Put, path, buildProductUpdate(product, changes));
}

async function deleteProduct({ client, params }: OperationContext): Promise<IDataObject> {
	const productId = params.string(Param.ProductId);
	await client.send<unknown>(HttpMethod.Delete, (workspaceId) =>
		ApiPath.product(workspaceId, productId),
	);
	return { id: productId, deleted: true };
}

export const productOperations: OperationMap<ProductOperation> = {
	[ProductOperation.Create]: createProduct,
	[ProductOperation.Delete]: deleteProduct,
	[ProductOperation.Get]: getProduct,
	[ProductOperation.GetMany]: getManyProducts,
	[ProductOperation.Update]: updateProduct,
};
