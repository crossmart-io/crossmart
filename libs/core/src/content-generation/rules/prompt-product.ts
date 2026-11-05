import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ContentGeneratorProduct } from '../../ai/prompts/content-generator.v1.prompt.js';
import {
  PROMPT_DESCRIPTION_MAX_LENGTH,
  PROMPT_OPTION_VALUES_MAX,
} from '../content-generation.constants.js';

/** What the model is told about a product, bounded so a pathological one stays cheap. */
export function promptProduct(product: ProductDetail): ContentGeneratorProduct {
  const optionValues = new Set(product.variants.flatMap((variant) => variant.optionValues));
  return {
    title: product.title,
    descriptionHtml: product.descriptionHtml.slice(0, PROMPT_DESCRIPTION_MAX_LENGTH),
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    optionNames: product.optionNames,
    optionValues: [...optionValues].slice(0, PROMPT_OPTION_VALUES_MAX),
  };
}
