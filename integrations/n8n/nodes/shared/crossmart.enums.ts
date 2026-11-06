/** Methods that fill the nodes' dropdowns. */
export enum LoadOptionsMethod {
	GetStores = 'getStores',
}

/** HTTP methods the Crossmart API uses. */
export enum HttpMethod {
	Get = 'GET',
	Post = 'POST',
	Put = 'PUT',
	Delete = 'DELETE',
}

export enum ProductStatus {
	Draft = 'DRAFT',
	Active = 'ACTIVE',
	Archived = 'ARCHIVED',
}

export enum ProductSort {
	Title = 'title',
	UpdatedAt = 'updatedAt',
	CreatedAt = 'createdAt',
}

export enum SortDirection {
	Asc = 'asc',
	Desc = 'desc',
}

export enum OrderStatus {
	Open = 'OPEN',
	PartiallyFulfilled = 'PARTIALLY_FULFILLED',
	Fulfilled = 'FULFILLED',
	Cancelled = 'CANCELLED',
}

export enum ListingStatus {
	Pending = 'PENDING',
	Active = 'ACTIVE',
	Inactive = 'INACTIVE',
	Error = 'ERROR',
	Delisted = 'DELISTED',
}

export enum StockLevel {
	InStock = 'in_stock',
	LowStock = 'low_stock',
	OutOfStock = 'out_of_stock',
	Untracked = 'untracked',
}

export enum InventorySort {
	Title = 'title',
	Available = 'available',
	UpdatedAt = 'updated_at',
}

export enum StockAdjustmentMode {
	Delta = 'delta',
	Set = 'set',
}

/** The stock movement reasons a person or integration may record; Crossmart records the rest. */
export enum ManualMovementReason {
	Received = 'RECEIVED',
	Correction = 'CORRECTION',
	Returned = 'RETURNED',
	Damaged = 'DAMAGED',
	Lost = 'LOST',
	Sold = 'SOLD',
}

/** The events Crossmart delivers to webhook endpoints. */
export enum WebhookEventType {
	OrderCreated = 'order.created',
	OrderUpdated = 'order.updated',
	InventoryStockChanged = 'inventory.stock_changed',
	ListingPublished = 'listing.published',
	ListingFailed = 'listing.failed',
	ListingRemoved = 'listing.removed',
	ProductCreated = 'product.created',
	ProductUpdated = 'product.updated',
	ProductDeleted = 'product.deleted',
	/** Sent by "Send test" to one endpoint, whatever it subscribes to. */
	Test = 'webhook.test',
}

/** HTTP statuses the nodes act on. */
export enum HttpStatus {
	BadRequest = '400',
	PaymentRequired = '402',
	Forbidden = '403',
	NotFound = '404',
}

/** Why a delivery's signature was rejected. */
export enum SignatureFailure {
	Missing = 'missing',
	Malformed = 'malformed',
	Expired = 'expired',
	Mismatch = 'mismatch',
}
