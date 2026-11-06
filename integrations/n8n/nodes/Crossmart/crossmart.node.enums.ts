export enum Resource {
	Inventory = 'inventory',
	Listing = 'listing',
	Order = 'order',
	Product = 'product',
	Store = 'store',
}

export enum ProductOperation {
	Create = 'create',
	Delete = 'delete',
	Get = 'get',
	GetMany = 'getMany',
	Update = 'update',
}

export enum InventoryOperation {
	Adjust = 'adjust',
	GetBySku = 'getBySku',
	GetHistory = 'getHistory',
	GetMany = 'getMany',
}

export enum ListingOperation {
	GetForProduct = 'getForProduct',
	GetManyForStore = 'getManyForStore',
	Publish = 'publish',
	Retry = 'retry',
	Unpublish = 'unpublish',
}

export enum OrderOperation {
	Get = 'get',
	GetMany = 'getMany',
}

export enum StoreOperation {
	Get = 'get',
	GetMany = 'getMany',
	GetSyncProgress = 'getSyncProgress',
	Sync = 'sync',
}

/** Names of the node's top-level parameters. */
export enum Param {
	AdditionalFields = 'additionalFields',
	ConnectionId = 'connectionId',
	Filters = 'filters',
	InventoryItemId = 'inventoryItemId',
	Limit = 'limit',
	Mode = 'mode',
	Operation = 'operation',
	OrderId = 'orderId',
	ProductId = 'productId',
	Quantity = 'quantity',
	Reason = 'reason',
	Resource = 'resource',
	ReturnAll = 'returnAll',
	Sku = 'sku',
	Title = 'title',
	UpdateFields = 'updateFields',
	Variants = 'variants',
}

/** Names of the fields inside collections, matching the API's field names. */
export enum Field {
	CompareAtPrice = 'compareAtPrice',
	ConnectionId = 'connectionId',
	DescriptionHtml = 'descriptionHtml',
	Direction = 'direction',
	Handle = 'handle',
	Note = 'note',
	OptionNames = 'optionNames',
	OptionValues = 'optionValues',
	Price = 'price',
	ProductType = 'productType',
	Quantity = 'quantity',
	Search = 'search',
	Sku = 'sku',
	Sort = 'sort',
	Status = 'status',
	StockLevel = 'stockLevel',
	Tags = 'tags',
	Title = 'title',
	Variant = 'variant',
	Vendor = 'vendor',
}
