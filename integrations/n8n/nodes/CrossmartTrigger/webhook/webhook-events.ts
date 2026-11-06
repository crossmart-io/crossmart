import type { IDataObject, IHookFunctions, IWebhookFunctions } from 'n8n-workflow';
import { WebhookEventType } from '../../shared/crossmart.enums';
import type { WebhookEnvelope } from '../../shared/crossmart.types';
import { isEnumValue } from '../../shared/parameter-reader';
import { TriggerParam } from '../crossmart-trigger.enums';

/** The events the user chose, in the order Crossmart lists them. */
export function selectedEvents(context: IHookFunctions | IWebhookFunctions): WebhookEventType[] {
	const value = context.getNodeParameter(TriggerParam.Events, []);
	const chosen = Array.isArray(value) ? value : [];
	return Object.values(WebhookEventType).filter(
		(eventType) => eventType !== WebhookEventType.Test && chosen.includes(eventType),
	);
}

/** Whether the workflow runs for an event: a chosen one, or a test event. */
export function isWanted(eventType: string, chosen: readonly WebhookEventType[]): boolean {
	if (eventType === WebhookEventType.Test) return true;
	return isEnumValue(WebhookEventType, eventType) && chosen.includes(eventType);
}

const isDataObject = (value: unknown): value is IDataObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const ENVELOPE_TEXT_FIELDS = ['id', 'type', 'createdAt', 'workspaceId', 'apiVersion'] as const;

/** Whether a delivered body has the shape of a Crossmart event envelope. */
export function isEnvelope(body: unknown): body is WebhookEnvelope {
	if (!isDataObject(body) || !isDataObject(body.data)) return false;
	return ENVELOPE_TEXT_FIELDS.every((field) => typeof body[field] === 'string');
}

/** The delivered event, as sent, or undefined when the body is not a Crossmart event. */
export function parseEnvelope(rawBody: Buffer): WebhookEnvelope | undefined {
	try {
		const body: unknown = JSON.parse(rawBody.toString());
		return isEnvelope(body) ? body : undefined;
	} catch {
		return undefined;
	}
}
