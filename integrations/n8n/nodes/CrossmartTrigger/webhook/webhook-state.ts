import type { IDataObject } from 'n8n-workflow';
import { MAX_REMEMBERED_EVENT_IDS } from '../crossmart-trigger.constants';
import { WebhookStateKey } from '../crossmart-trigger.enums';
import { rememberIds } from '../dedupe';

/** The endpoint the trigger created, with the secret that signs its deliveries. */
export type RegisteredEndpoint = {
	endpointId: string;
	secret: string;
};

/**
 * Typed access to what the webhook trigger remembers in the node's static data: its endpoint, the
 * endpoint's signing secret, and the ids of the latest events, to drop redelivered ones. n8n saves
 * it after the lifecycle hooks and after each webhook call.
 */
export class WebhookState {
	constructor(private readonly data: IDataObject) {}

	get endpointId(): string | undefined {
		return this.text(WebhookStateKey.EndpointId);
	}

	get secret(): string | undefined {
		return this.text(WebhookStateKey.Secret);
	}

	register(endpoint: RegisteredEndpoint): void {
		this.data[WebhookStateKey.EndpointId] = endpoint.endpointId;
		this.data[WebhookStateKey.Secret] = endpoint.secret;
		delete this.data[WebhookStateKey.RecentEventIds];
	}

	clear(): void {
		for (const key of Object.values(WebhookStateKey)) delete this.data[key];
	}

	/** Remembers an event id; false when it was already delivered. */
	markDelivered(eventId: string): boolean {
		const recentIds = this.recentEventIds();
		if (recentIds.includes(eventId)) return false;
		this.data[WebhookStateKey.RecentEventIds] = rememberIds(
			recentIds,
			[eventId],
			MAX_REMEMBERED_EVENT_IDS,
		);
		return true;
	}

	private recentEventIds(): string[] {
		const value = this.data[WebhookStateKey.RecentEventIds];
		return Array.isArray(value)
			? value.filter((entry): entry is string => typeof entry === 'string')
			: [];
	}

	private text(key: WebhookStateKey): string | undefined {
		const value = this.data[key];
		return typeof value === 'string' && value !== '' ? value : undefined;
	}
}
