import type { INodeProperties } from 'n8n-workflow';
import { WebhookEventType } from '../../shared/crossmart.enums';
import { TriggerParam } from '../crossmart-trigger.enums';

/** The parameters of the webhook trigger: the events that start the workflow. */
export const webhookProperties: INodeProperties[] = [
	{
		displayName:
			'Crossmart sends events to this workflow’s webhook URL, so n8n must be reachable from the internet over https. The API key needs the webhooks:manage permission (ADMIN role). If Crossmart cannot reach n8n, use the Crossmart Polling Trigger instead.',
		name: TriggerParam.WebhookNotice,
		type: 'notice',
		default: '',
	},
	{
		displayName: 'Events',
		name: TriggerParam.Events,
		type: 'multiOptions',
		required: true,
		noDataExpression: true,
		options: [
			{
				name: 'Inventory Stock Changed',
				value: WebhookEventType.InventoryStockChanged,
				description: 'Stock changed, by a sale, an adjustment, an import or a sync',
			},
			{
				name: 'Listing Failed',
				value: WebhookEventType.ListingFailed,
				description: 'A store rejected a product’s publish or update',
			},
			{
				name: 'Listing Published',
				value: WebhookEventType.ListingPublished,
				description: 'A product went live on a store',
			},
			{
				name: 'Listing Removed',
				value: WebhookEventType.ListingRemoved,
				description: 'A product was taken off a store',
			},
			{
				name: 'Order Created',
				value: WebhookEventType.OrderCreated,
				description: 'An order came in from a connected store',
			},
			{
				name: 'Order Updated',
				value: WebhookEventType.OrderUpdated,
				description: 'An order changed, such as its status or fulfillment',
			},
			{
				name: 'Product Created',
				value: WebhookEventType.ProductCreated,
			},
			{
				name: 'Product Deleted',
				value: WebhookEventType.ProductDeleted,
			},
			{
				name: 'Product Updated',
				value: WebhookEventType.ProductUpdated,
			},
		],
		default: [WebhookEventType.OrderCreated],
		description:
			'The events that start the workflow. Test events sent from Crossmart always start it.',
	},
];
