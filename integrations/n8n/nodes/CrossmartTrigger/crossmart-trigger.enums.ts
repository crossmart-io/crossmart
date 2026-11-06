/** What the trigger watches for. */
export enum TriggerEvent {
	ListingFailed = 'listingFailed',
	NewOrder = 'newOrder',
	StockChanged = 'stockChanged',
}

export enum TriggerParam {
	ConnectionId = 'connectionId',
	Event = 'event',
}

/** Keys of what the trigger remembers between polls, in the workflow's static data. */
export enum StateKey {
	FailureKeys = 'failureKeys',
	IdsAtWatermark = 'idsAtWatermark',
	Initialized = 'initialized',
	SeenIds = 'seenIds',
	Watermark = 'watermark',
}
