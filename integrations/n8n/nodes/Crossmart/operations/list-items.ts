import type { IDataObject } from 'n8n-workflow';
import type { WorkspacePath } from '../../shared/crossmart-client';
import type { QueryParams } from '../../shared/request-options';
import { Param } from '../crossmart.node.enums';
import type { OperationContext } from './operation.types';

/** A "Get Many" operation: every item when "Return All" is on, otherwise up to "Limit". */
export async function listItems(
	{ client, params }: OperationContext,
	path: WorkspacePath,
	query: QueryParams = {},
): Promise<IDataObject[]> {
	const returnAll = params.boolean(Param.ReturnAll);
	const maxItems = returnAll ? undefined : params.number(Param.Limit);
	return client.getAll<IDataObject>(path, query, maxItems);
}
