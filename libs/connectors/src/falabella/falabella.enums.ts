/**
 * A Falabella country, by the operator code its Seller Center API uses (`OperatorCode`). Each
 * connection sells in one country; a seller in several connects each one.
 */
export enum FalabellaCountry {
  Chile = 'facl',
  Colombia = 'faco',
  Peru = 'fape',
}

/** The fields a merchant pastes to connect Falabella. */
export enum FalabellaCredentialField {
  /** The seller id under "Mi cuenta", sent in every request's User-Agent. */
  SellerId = 'sellerId',
  /** The Seller Center user's email, sent as `UserID`. */
  UserId = 'userId',
  /** The user's API key. It only signs requests and is never sent. */
  ApiKey = 'apiKey',
  /** A `FalabellaCountry`. */
  Country = 'country',
}

/** The Seller Center API calls the connector makes (`Action`). */
export enum FalabellaAction {
  FeedCount = 'FeedCount',
  FeedStatus = 'FeedStatus',
  GetCategoryTree = 'GetCategoryTree',
  GetCategoryAttributes = 'GetCategoryAttributes',
  GetCategorySuggestion = 'GetCategorySuggestion',
  GetProducts = 'GetProducts',
  ProductCreate = 'ProductCreate',
  ProductUpdate = 'ProductUpdate',
  Image = 'Image',
  GetOrders = 'GetOrders',
  GetOrder = 'GetOrder',
  GetOrderItems = 'GetOrderItems',
  GetMultipleOrderItems = 'GetMultipleOrderItems',
}

/** Where a feed (an asynchronous write) stands, as `FeedStatus` reports it. */
export enum FalabellaFeedStatus {
  Queued = 'Queued',
  Processing = 'Processing',
  Canceled = 'Canceled',
  Finished = 'Finished',
  Error = 'Error',
}

/** A product's status in one country (`BusinessUnit.Status`). */
export enum FalabellaProductStatus {
  Active = 'active',
  Inactive = 'inactive',
}

/** The `Filter` of `GetProducts`: which products to return, by status. */
export enum FalabellaProductFilter {
  All = 'all',
}

/** The status of one order item. Each item is one unit. */
export enum FalabellaOrderItemStatus {
  Pending = 'pending',
  ReadyToShip = 'ready_to_ship',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Canceled = 'canceled',
  FailedDelivery = 'failed_delivery',
  ReturnShippedByCustomer = 'return_shipped_by_customer',
  ReturnWaitingForApproval = 'return_waiting_for_approval',
  ReturnRejected = 'return_rejected',
  Returned = 'returned',
}

/** The values of `GetOrders`' sort parameters. */
export enum FalabellaOrderSort {
  UpdatedAt = 'updatedat',
}

export enum FalabellaSortDirection {
  Ascending = 'ASC',
}

/** Who ships an order: the seller (`dropshipping`), or Falabella from its warehouse. */
export enum FalabellaShippingType {
  Dropshipping = 'dropshipping',
}

/**
 * How Falabella names an item's condition (`ConditionType`). The docs show `Nuevo` and say the
 * values depend on the category, so a category's own options win when it lists them.
 */
export enum FalabellaCondition {
  New = 'Nuevo',
  Used = 'Usado',
  Refurbished = 'Reacondicionado',
}

/** How `GetCategoryAttributes` types an attribute (`AttributeType`). */
export enum FalabellaAttributeType {
  Value = 'value',
  Option = 'option',
  /** Sent outside `ProductData`, on the product itself. */
  System = 'system',
}

/** Where an attribute goes in a product: on the product itself, or in its `ProductData`. */
export enum FalabellaAttributePlacement {
  Product = 'product',
  ProductData = 'product_data',
}

/** Whether a Falabella error is the caller's (`Sender`) or Falabella's (`Platform`). */
export enum FalabellaErrorType {
  Sender = 'Sender',
  Platform = 'Platform',
}

/** The elements of a product in a Seller Center request, and the attributes Crossmart fills. */
export enum FalabellaField {
  Product = 'Product',
  SellerSku = 'SellerSku',
  ParentSku = 'ParentSku',
  Name = 'Name',
  Description = 'Description',
  Brand = 'Brand',
  PrimaryCategory = 'PrimaryCategory',
  Categories = 'Categories',
  ProductId = 'ProductId',
  Variation = 'Variation',
  BusinessUnits = 'BusinessUnits',
  BusinessUnit = 'BusinessUnit',
  OperatorCode = 'OperatorCode',
  Price = 'Price',
  SalePrice = 'SalePrice',
  SpecialPrice = 'SpecialPrice',
  SpecialFromDate = 'SpecialFromDate',
  SpecialToDate = 'SpecialToDate',
  Stock = 'Stock',
  Quantity = 'Quantity',
  Status = 'Status',
  ProductData = 'ProductData',
  ConditionType = 'ConditionType',
  PackageHeight = 'PackageHeight',
  PackageWidth = 'PackageWidth',
  PackageLength = 'PackageLength',
  PackageWeight = 'PackageWeight',
  TaxPercentage = 'TaxPercentage',
  ProductImage = 'ProductImage',
  Images = 'Images',
  Image = 'Image',
}
