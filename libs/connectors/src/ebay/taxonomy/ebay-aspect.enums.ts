/** `aspectConstraint.aspectUsage` in the Taxonomy API. */
export enum EbayAspectUsage {
  Recommended = 'RECOMMENDED',
  Optional = 'OPTIONAL',
}

/** `aspectConstraint.aspectMode` in the Taxonomy API. */
export enum EbayAspectMode {
  FreeText = 'FREE_TEXT',
  SelectionOnly = 'SELECTION_ONLY',
}

/** `aspectConstraint.itemToAspectCardinality` in the Taxonomy API. */
export enum EbayAspectCardinality {
  Single = 'SINGLE',
  Multi = 'MULTI',
}
