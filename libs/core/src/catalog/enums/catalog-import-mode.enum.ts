/** What an import does with the records of its file. */
export enum CatalogImportMode {
  /** Adds products whose handle is not in the catalog yet; existing ones are left untouched. */
  Create = 'create',
  /** Replaces existing products matched by handle; their variants are matched by SKU. */
  Update = 'update',
  /** Sets the available stock of tracked variants, matched by SKU. */
  Inventory = 'inventory',
}
