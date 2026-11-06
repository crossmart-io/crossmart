/**
 * The parts of the Crossmart API responses the nodes read. Responses carry more fields; the nodes
 * pass them through untouched. Type aliases (not interfaces) so they are valid n8n JSON.
 */

/** One page of a list endpoint. Every list in the API pages the same way. */
export type Page<Item> = {
	items: Item[];
	/** Pass as `cursor` to read the next page; `null` on the last page. */
	nextCursor: string | null;
	total: number;
};

export type CurrentApiKey = {
	workspaceId: string;
	role: string;
};

export type Variant = {
	id: string;
	sku: string | null;
	barcode: string | null;
	optionValues: string[];
	price: string;
	compareAtPrice: string | null;
	cost: string | null;
	weightGrams: number | null;
	requiresShipping: boolean;
	taxable: boolean;
	outOfStockPolicy: string;
	tracked: boolean;
	available: number;
};

export type Media = {
	id: string;
	url: string;
	altText: string | null;
};

export type Product = {
	id: string;
	handle: string;
	title: string;
	descriptionHtml: string;
	vendor: string | null;
	productType: string | null;
	tags: string[];
	status: string;
	optionNames: string[];
	variants: Variant[];
	media: Media[];
	createdAt: string;
	updatedAt: string;
};

export type InventoryItem = {
	inventoryItemId: string;
	variantId: string;
	productId: string;
	productTitle: string;
	sku: string | null;
	onHand: number;
	reserved: number;
	available: number;
	stockLevel: string;
	updatedAt: string;
};

export type OrderSummary = {
	id: string;
	name: string;
	status: string;
	placedAt: string;
	connectionId: string;
};

export type Store = {
	id: string;
	channel: string;
	displayName: string;
	status: string;
	/** Listings in this store whose last sync failed. */
	failedListings: number;
};

/** A product's listing on one store, as a store's listings page returns it. */
export type StoreListing = {
	id: string;
	productId: string;
	productTitle: string;
	status: string;
	lastError: string | null;
	lastSyncedAt: string | null;
};
