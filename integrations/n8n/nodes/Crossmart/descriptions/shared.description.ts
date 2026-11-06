import type { IDisplayOptions, INodeProperties } from 'n8n-workflow';
import {
	DEFAULT_RETURN_LIMIT,
	EXPRESSION_HINT,
	MAX_PAGE_SIZE,
} from '../../shared/crossmart.constants';
import { LoadOptionsMethod, SortDirection } from '../../shared/crossmart.enums';
import { Field, Param, type Resource } from '../crossmart.node.enums';

/* Parameter defaults are named so n8n's linter can read them. */
const DEFAULT_SORT_DIRECTION = SortDirection.Asc;

/** Shows a parameter only for these operations of a resource. */
export function showFor(resource: Resource, operations: string[]): IDisplayOptions {
	return { show: { resource: [resource], operation: operations } };
}

/** "Return All" and "Limit" for a "Get Many" operation. */
export function paginationFields(resource: Resource, operation: string): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: Param.ReturnAll,
			type: 'boolean',
			displayOptions: showFor(resource, [operation]),
			default: false,
			description: 'Whether to return all results or only up to a given limit',
		},
		{
			displayName: 'Limit',
			name: Param.Limit,
			type: 'number',
			displayOptions: {
				show: { resource: [resource], operation: [operation], returnAll: [false] },
			},
			typeOptions: { minValue: 1, maxValue: MAX_PAGE_SIZE },
			default: DEFAULT_RETURN_LIMIT,
			description: 'Max number of results to return',
		},
	];
}

/** A required store picker, filled from the workspace's connected stores. */
export function storeField(resource: Resource, operations: string[]): INodeProperties {
	return {
		displayName: 'Store Name or ID',
		name: Param.ConnectionId,
		type: 'options',
		typeOptions: { loadOptionsMethod: LoadOptionsMethod.GetStores },
		required: true,
		displayOptions: showFor(resource, operations),
		default: '',
		description: EXPRESSION_HINT,
	};
}

/** A required id parameter. */
export function idField(
	resource: Resource,
	operations: string[],
	field: { name: Param; displayName: string; description: string },
): INodeProperties {
	return {
		...field,
		type: 'string',
		required: true,
		displayOptions: showFor(resource, operations),
		default: '',
	};
}

export const sortDirectionField: INodeProperties = {
	displayName: 'Sort Direction',
	name: Field.Direction,
	type: 'options',
	options: [
		{ name: 'Ascending', value: SortDirection.Asc },
		{ name: 'Descending', value: SortDirection.Desc },
	],
	default: DEFAULT_SORT_DIRECTION,
};
