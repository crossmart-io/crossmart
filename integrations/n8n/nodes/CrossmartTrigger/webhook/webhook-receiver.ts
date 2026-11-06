import type { IDataObject, IWebhookFunctions, IWebhookResponseData } from 'n8n-workflow';
import { SIGNATURE_HEADER } from '../../shared/crossmart.constants';
import { verifySignature } from '../../shared/webhook-signature';
import {
	BAD_REQUEST_STATUS,
	IGNORED_RESPONSE,
	INVALID_EVENT_MESSAGE,
	INVALID_SIGNATURE_MESSAGE,
	NODE_STATIC_DATA,
	UNAUTHORIZED_STATUS,
} from '../crossmart-trigger.constants';
import { isWanted, parseEnvelope, selectedEvents } from './webhook-events';
import { WebhookState } from './webhook-state';

/** The parts of n8n's (Express) request the receiver reads. */
type RawBodyRequest = {
	rawBody?: Buffer;
	readRawBody?: () => Promise<void>;
};

/** The parts of n8n's (Express) response the receiver writes. */
type ErrorReply = {
	status(code: number): { json(body: IDataObject): unknown };
};

/**
 * Handles one delivery: checks its signature with the endpoint's secret, drops events the user did
 * not choose and events already delivered, and starts the workflow with the event envelope.
 */
export async function receiveDelivery(context: IWebhookFunctions): Promise<IWebhookResponseData> {
	const state = new WebhookState(context.getWorkflowStaticData(NODE_STATIC_DATA));
	const rawBody = await readRawBody(context.getRequestObject());
	if (!isSigned(context, state, rawBody)) {
		return reject(context, UNAUTHORIZED_STATUS, INVALID_SIGNATURE_MESSAGE);
	}
	const envelope = parseEnvelope(rawBody);
	if (envelope === undefined) return reject(context, BAD_REQUEST_STATUS, INVALID_EVENT_MESSAGE);
	if (!isWanted(envelope.type, selectedEvents(context)) || !state.markDelivered(envelope.id)) {
		return { webhookResponse: IGNORED_RESPONSE };
	}
	return { workflowData: [[{ json: envelope }]] };
}

/** The body exactly as it was sent; the signature covers these bytes, not the parsed JSON. */
async function readRawBody(request: RawBodyRequest): Promise<Buffer> {
	if (request.rawBody === undefined && request.readRawBody !== undefined) {
		await request.readRawBody();
	}
	return request.rawBody ?? Buffer.alloc(0);
}

function isSigned(context: IWebhookFunctions, state: WebhookState, rawBody: Buffer): boolean {
	const secret = state.secret;
	if (secret === undefined) return false;
	const header = context.getHeaderData()[SIGNATURE_HEADER];
	const failure = verifySignature({
		secret,
		header: Array.isArray(header) ? header[0] : header,
		rawBody,
	});
	return failure === undefined;
}

function reject(context: IWebhookFunctions, status: number, message: string): IWebhookResponseData {
	const reply: ErrorReply = context.getResponseObject();
	reply.status(status).json({ message });
	return { noWebhookResponse: true };
}
