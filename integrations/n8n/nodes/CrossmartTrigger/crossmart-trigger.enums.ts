/** What the polling trigger watches for. */
export enum TriggerEvent {
	ListingFailed = 'listingFailed',
	NewOrder = 'newOrder',
	StockChanged = 'stockChanged',
}

export enum TriggerParam {
	ConnectionId = 'connectionId',
	Event = 'event',
	/** The webhook trigger's events. */
	Events = 'events',
	WebhookNotice = 'webhookNotice',
}

/** Keys of what the polling trigger remembers between polls, in the workflow's static data. */
export enum StateKey {
	FailureKeys = 'failureKeys',
	IdsAtWatermark = 'idsAtWatermark',
	Initialized = 'initialized',
	SeenIds = 'seenIds',
	Watermark = 'watermark',
}

/** Keys of what the webhook trigger remembers about its endpoint, in the workflow's static data. */
export enum WebhookStateKey {
	EndpointId = 'endpointId',
	RecentEventIds = 'recentEventIds',
	Secret = 'secret',
}
