import type { IDataObject } from 'n8n-workflow';
import { ApiPath } from '../../shared/api-paths';
import type { WorkspacePath } from '../../shared/crossmart-client';
import { HttpMethod, ListingStatus } from '../../shared/crossmart.enums';
import { enumField } from '../../shared/parameter-reader';
import { Field, ListingOperation, Param } from '../crossmart.node.enums';
import { listItems } from './list-items';
import type { OperationContext, OperationMap } from './operation.types';

type ProductChannelRoute = (workspaceId: string, productId: string, connectionId: string) => string;

/** The route of the product and store the item names. */
function productChannelPath(
	{ params }: OperationContext,
	route: ProductChannelRoute,
): WorkspacePath {
	const productId = params.string(Param.ProductId);
	const connectionId = params.string(Param.ConnectionId);
	return (workspaceId) => route(workspaceId, productId, connectionId);
}

/** The product on every store: selection, listing status, override and prices there. */
async function getForProduct({ client, params }: OperationContext): Promise<IDataObject[]> {
	const productId = params.string(Param.ProductId);
	return client.get<IDataObject[]>((workspaceId) =>
		ApiPath.productChannels(workspaceId, productId),
	);
}

async function getManyForStore(context: OperationContext): Promise<IDataObject[]> {
	const connectionId = context.params.string(Param.ConnectionId);
	const filters = context.params.collection(Param.Filters);
	return listItems(context, (workspaceId) => ApiPath.storeListings(workspaceId, connectionId), {
		status: enumField(filters, Field.Status, ListingStatus),
	});
}

async function publish(context: OperationContext): Promise<IDataObject> {
	return context.client.send<IDataObject>(
		HttpMethod.Post,
		productChannelPath(context, ApiPath.productChannel),
	);
}

async function retry(context: OperationContext): Promise<IDataObject> {
	return context.client.send<IDataObject>(
		HttpMethod.Post,
		productChannelPath(context, ApiPath.productChannelRetry),
	);
}

async function unpublish(context: OperationContext): Promise<IDataObject> {
	return context.client.send<IDataObject>(
		HttpMethod.Delete,
		productChannelPath(context, ApiPath.productChannel),
	);
}

export const listingOperations: OperationMap<ListingOperation> = {
	[ListingOperation.GetForProduct]: getForProduct,
	[ListingOperation.GetManyForStore]: getManyForStore,
	[ListingOperation.Publish]: publish,
	[ListingOperation.Retry]: retry,
	[ListingOperation.Unpublish]: unpublish,
};
