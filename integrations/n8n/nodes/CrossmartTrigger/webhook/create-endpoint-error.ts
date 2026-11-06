import type { INode } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { HttpStatus } from '../../shared/crossmart.enums';
import { httpStatusOf, toNodeApiError } from '../../shared/errors';

/** What to tell the user when Crossmart refuses to create the trigger's endpoint. */
const CREATE_FAILURE_MESSAGES: Partial<Record<string, string>> = {
	[HttpStatus.BadRequest]:
		'Crossmart rejected this n8n webhook URL. Crossmart Cloud delivers only to public https URLs: make n8n reachable from the internet over https, or use the Crossmart Polling Trigger',
	[HttpStatus.PaymentRequired]:
		'The workspace has reached its plan’s limit of webhook endpoints. Remove an endpoint you no longer use, or use the Crossmart Polling Trigger',
	[HttpStatus.Forbidden]: 'The API key needs the webhooks:manage permission (ADMIN role)',
};

/** The error for a failed endpoint creation, explained when the status has a known cause. */
export function createEndpointError(node: INode, error: unknown): NodeApiError {
	const apiError = toNodeApiError(node, error);
	const status = httpStatusOf(apiError);
	const message = status === undefined ? undefined : CREATE_FAILURE_MESSAGES[status];
	if (message === undefined) return apiError;
	return new NodeApiError(
		node,
		{ message: apiError.description ?? apiError.message, httpCode: status ?? null },
		{ message, description: apiError.description ?? undefined },
	);
}
