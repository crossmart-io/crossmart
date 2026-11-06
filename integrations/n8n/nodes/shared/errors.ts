import type { INode, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

const isJsonObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** Wraps a failed API call so n8n shows the API's status and message. */
export function toNodeApiError(node: INode, error: unknown): NodeApiError {
	if (error instanceof NodeApiError) return error;
	const response: JsonObject = isJsonObject(error) ? error : { message: String(error) };
	return new NodeApiError(node, response);
}

/** The error that fails an item: n8n errors as they are, anything else as an operation error. */
export function toNodeError(
	node: INode,
	error: unknown,
	itemIndex: number,
): NodeApiError | NodeOperationError {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) return error;
	const cause = error instanceof Error ? error : String(error);
	return new NodeOperationError(node, cause, { itemIndex });
}
