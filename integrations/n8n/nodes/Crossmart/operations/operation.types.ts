import type { IDataObject } from 'n8n-workflow';
import type { CrossmartClient } from '../../shared/crossmart-client';
import type { ParameterReader } from '../../shared/parameter-reader';

/** What an operation needs to run for one input item. */
export type OperationContext = {
	client: CrossmartClient;
	params: ParameterReader;
};

/** One object, or several that become separate output items. */
export type OperationResult = IDataObject | IDataObject[];

export type OperationHandler = (context: OperationContext) => Promise<OperationResult>;

/** The handler of every operation of a resource. */
export type OperationMap<Operation extends string> = Record<Operation, OperationHandler>;
