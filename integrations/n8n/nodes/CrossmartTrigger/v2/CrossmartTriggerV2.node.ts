import type {
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { CREDENTIAL_TYPE } from '../../shared/crossmart.constants';
import { TRIGGER_ICON, WEBHOOK_NAME, WEBHOOK_PATH } from '../crossmart-trigger.constants';
import { webhookProperties } from '../webhook/webhook.description';
import { WebhookLifecycle } from '../webhook/webhook-lifecycle';
import { receiveDelivery } from '../webhook/webhook-receiver';

/**
 * Version 2 of the Crossmart Trigger: Crossmart pushes events to n8n as they happen. Activating
 * the workflow creates a webhook endpoint in the workspace; deactivating it deletes the endpoint.
 */
export class CrossmartTriggerV2 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Crossmart Trigger',
		name: 'crossmartTrigger',
		icon: TRIGGER_ICON,
		group: ['trigger'],
		description: 'Starts the workflow when orders, stock, listings or products change in Crossmart',
		version: 2,
		subtitle: '={{$parameter["events"].join(", ")}}',
		defaults: { name: 'Crossmart Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: CREDENTIAL_TYPE, required: true }],
		webhooks: [
			{ name: WEBHOOK_NAME, httpMethod: 'POST', responseMode: 'onReceived', path: WEBHOOK_PATH },
		],
		properties: webhookProperties,
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return (await WebhookLifecycle.fromContext(this)).exists();
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return (await WebhookLifecycle.fromContext(this)).create();
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return (await WebhookLifecycle.fromContext(this)).delete();
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		return receiveDelivery(this);
	}
}
