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
