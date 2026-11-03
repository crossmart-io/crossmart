/** What the inventory table can be sorted by. */
export enum InventorySort {
  /** Product title, then the variants in the order the product lists them. */
  Title = 'title',
  Available = 'available',
  UpdatedAt = 'updated_at',
}
