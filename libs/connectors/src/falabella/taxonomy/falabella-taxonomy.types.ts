import { z } from 'zod';
import { xmlList, xmlObject, xmlOptionalText } from '../api/falabella-xml.js';

/** A `GetCategoryTree` node; only leaves take products. */
export interface FalabellaCategoryNode {
  Name: string;
  CategoryId: string;
  Children?: { Category: FalabellaCategoryNode[] };
}

export const categoryNodeSchema: z.ZodType<FalabellaCategoryNode> = z.lazy(() =>
  z.object({
    Name: z.string(),
    CategoryId: z.string(),
    Children: xmlObject({ Category: xmlList(categoryNodeSchema) }).optional(),
  }),
);

export const categoryTreeBodySchema = xmlObject({
  Categories: xmlObject({ Category: xmlList(categoryNodeSchema) }),
});

export const categorySuggestionBodySchema = xmlObject({
  SuggestedCategory: xmlObject({ CategoryId: xmlOptionalText.optional() }).optional(),
});

/** One attribute of `GetCategoryAttributes`. `FeedName` is the element name products use. */
export const categoryAttributeSchema = z.object({
  Label: z.string(),
  Name: z.string(),
  FeedName: xmlOptionalText.optional(),
  GroupName: xmlOptionalText.optional(),
  isMandatory: z.string(),
  IsGlobalAttribute: xmlOptionalText.optional(),
  AttributeType: xmlOptionalText.optional(),
  Options: xmlObject({ Option: xmlList(z.object({ Name: z.string() })).optional() }).optional(),
});

export type FalabellaCategoryAttribute = z.infer<typeof categoryAttributeSchema>;

export const categoryAttributesBodySchema = xmlObject({
  Attribute: xmlList(categoryAttributeSchema).optional(),
});
