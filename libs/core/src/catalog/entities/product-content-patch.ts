/** A partial edit of a product's text: only the fields given change. */
export interface ProductContentPatch {
  title?: string;
  /** HTML; sanitized before it is stored, like every description. */
  descriptionHtml?: string;
}
