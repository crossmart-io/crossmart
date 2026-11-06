import type { IHookFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ApiPath } from '../../shared/api-paths';
import { CrossmartClient } from '../../shared/crossmart-client';
import { HttpMethod, HttpStatus } from '../../shared/crossmart.enums';
import type { CreatedWebhookEndpoint, WebhookEndpoint } from '../../shared/crossmart.types';
import { httpStatusOf, toNodeApiError } from '../../shared/errors';
import {
	ENDPOINT_DESCRIPTION_PREFIX,
	NO_EVENTS_MESSAGE,
	NO_WEBHOOK_URL_MESSAGE,
	NODE_STATIC_DATA,
	WEBHOOK_NAME,
} from '../crossmart-trigger.constants';
import { createEndpointError } from './create-endpoint-error';
import { selectedEvents } from './webhook-events';
import { WebhookState } from './webhook-state';

/**
 * The webhook trigger's endpoint in Crossmart, as n8n's webhook lifecycle sees it: n8n asks
 * whether it exists when the workflow is activated, creates it when it does not, and deletes it
 * when the workflow is deactivated.
 */
export class WebhookLifecycle {
	private readonly state: WebhookState;

	private constructor(
		private readonly context: IHookFunctions,
		private readonly client: CrossmartClient,
	) {
		this.state = new WebhookState(context.getWorkflowStaticData(NODE_STATIC_DATA));
	}

	static async fromContext(context: IHookFunctions): Promise<WebhookLifecycle> {
		return new WebhookLifecycle(context, await CrossmartClient.fromContext(context));
	}

	/** Whether the stored endpoint still exists, enabled, for this URL and these events. */
	async exists(): Promise<boolean> {
		const endpointId = this.state.endpointId;
		if (endpointId === undefined || this.state.secret === undefined) return false;
		const endpoint = await this.find(endpointId);
		return endpoint !== undefined && this.isCurrent(endpoint);
	}

	/** Creates the endpoint and stores its id and secret, replacing any endpoint stored before. */
	async create(): Promise<boolean> {
		const eventTypes = selectedEvents(this.context);
		if (eventTypes.length === 0) {
			throw new NodeOperationError(this.context.getNode(), NO_EVENTS_MESSAGE);
		}
		await this.delete();
		const created = await this.client
			.send<CreatedWebhookEndpoint>(HttpMethod.Post, ApiPath.webhookEndpoints, {
				url: this.webhookUrl(),
				eventTypes,
				description: this.endpointDescription(),
			})
			.catch((error: unknown) => {
				throw createEndpointError(this.context.getNode(), error);
			});
		this.state.register({ endpointId: created.endpoint.id, secret: created.secret });
		return true;
	}

	/** Deletes the stored endpoint; one that is already gone counts as deleted. */
	async delete(): Promise<boolean> {
		const endpointId = this.state.endpointId;
		if (endpointId !== undefined) {
			await this.ignoringNotFound(
				this.client.send(HttpMethod.Delete, (workspaceId) =>
					ApiPath.webhookEndpoint(workspaceId, endpointId),
				),
			);
		}
		this.state.clear();
		return true;
	}

	private async find(endpointId: string): Promise<WebhookEndpoint | undefined> {
		return this.ignoringNotFound(
			this.client.get<WebhookEndpoint>((workspaceId) =>
				ApiPath.webhookEndpoint(workspaceId, endpointId),
			),
		);
	}

	private isCurrent(endpoint: WebhookEndpoint): boolean {
		const wanted = selectedEvents(this.context);
		const subscribed = new Set(endpoint.eventTypes);
		return (
			endpoint.enabled &&
			endpoint.url === this.webhookUrl() &&
			wanted.length === subscribed.size &&
			wanted.every((eventType) => subscribed.has(eventType))
		);
	}

	/** The result of a request, or undefined when Crossmart answers 404. */
	private async ignoringNotFound<Response>(
		request: Promise<Response>,
	): Promise<Response | undefined> {
		try {
			return await request;
		} catch (error) {
			if (httpStatusOf(error) === HttpStatus.NotFound) return undefined;
			throw toNodeApiError(this.context.getNode(), error);
		}
	}

	private webhookUrl(): string {
		const url = this.context.getNodeWebhookUrl(WEBHOOK_NAME);
		if (url === undefined) {
			throw new NodeOperationError(this.context.getNode(), NO_WEBHOOK_URL_MESSAGE);
		}
		return url;
	}

	/** Names the workflow, so people can tell n8n's endpoints apart in Crossmart. */
	private endpointDescription(): string {
		const { id, name } = this.context.getWorkflow();
		const label = name ? `${name} (${id ?? ''})` : (id ?? '');
		return `${ENDPOINT_DESCRIPTION_PREFIX} ${label}`.trim();
	}
}
