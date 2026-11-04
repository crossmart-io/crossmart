/** Header names of the inventory CSV. Matched ignoring case and surrounding spaces. */
export enum InventoryCsvColumn {
  Sku = 'sku',
  Available = 'available',
}

/** Column order of the downloadable template. */
export const INVENTORY_CSV_COLUMNS = [
  InventoryCsvColumn.Sku,
  InventoryCsvColumn.Available,
] as const;
