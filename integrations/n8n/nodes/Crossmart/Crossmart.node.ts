import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { CrossmartClient } from '../shared/crossmart-client';
import { CREDENTIAL_TYPE } from '../shared/crossmart.constants';
import { toNodeError } from '../shared/errors';
import { ParameterReader } from '../shared/parameter-reader';
import { getStores } from '../shared/store-options';
import { LoadOptionsMethod } from '../shared/crossmart.enums';
import { Param, Resource } from './crossmart.node.enums';
import { inventoryDescription } from './descriptions/inventory.description';
import { listingDescription } from './descriptions/listing.description';
import { orderDescription } from './descriptions/order.description';
import { productDescription } from './descriptions/product.description';
import { storeDescription } from './descriptions/store.description';
import { resolveOperation } from './operations';
import type { OperationResult } from './operations/operation.types';

/* Parameter defaults are named so n8n's linter can read them. */
const DEFAULT_RESOURCE = Resource.Product;

export class Crossmart implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Crossmart',
		name: 'crossmart',
		icon: { light: 'file:../../icons/crossmart.svg', dark: 'file:../../icons/crossmart.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage products, stock, listings, orders and stores in Crossmart',
		defaults: { name: 'Crossmart' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: CREDENTIAL_TYPE, required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: Param.Resource,
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Inventory', value: Resource.Inventory },
					{ name: 'Listing', value: Resource.Listing },
					{ name: 'Order', value: Resource.Order },
					{ name: 'Product', value: Resource.Product },
					{ name: 'Store', value: Resource.Store },
				],
				default: DEFAULT_RESOURCE,
			},
			...productDescription,
			...inventoryDescription,
			...listingDescription,
			...orderDescription,
			...storeDescription,
		],
	};

	methods = {
		loadOptions: { [LoadOptionsMethod.GetStores]: getStores },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const client = await CrossmartClient.fromContext(this);
		const results: INodeExecutionData[] = [];
		const items = this.getInputData();
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const params = new ParameterReader(this, itemIndex);
				const handler = resolveOperation(
					this.getNode(),
					params.string(Param.Resource),
					params.string(Param.Operation),
				);
				results.push(...toExecutionData(await handler({ client, params }), itemIndex));
			} catch (error) {
				if (!this.continueOnFail()) throw toNodeError(this.getNode(), error, itemIndex);
				results.push({ json: { error: errorMessage(error) }, pairedItem: { item: itemIndex } });
			}
		}
		return [results];
	}
}

/** One output item per returned object, each paired with the input item it came from. */
export function toExecutionData(result: OperationResult, itemIndex: number): INodeExecutionData[] {
	const objects: IDataObject[] = Array.isArray(result) ? result : [result];
	return objects.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}

const errorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);
