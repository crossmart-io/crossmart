/** What a bulk action does to every selected product. */
export enum BulkProductAction {
  SetStatus = 'set_status',
  AddTags = 'add_tags',
  RemoveTags = 'remove_tags',
  AdjustPrices = 'adjust_prices',
  Delete = 'delete',
}
