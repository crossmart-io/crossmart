import { z } from 'zod';
import type { ShopifyOperation } from './shopify-operation.js';
import { shopifyUserErrorsSchema } from './shopify-user-error.js';

export interface PublishablePublishVariables {
  id: string;
  input: { publicationId: string }[];
}

const publishablePublishDataSchema = z.object({
  publishablePublish: z.object({ userErrors: shopifyUserErrorsSchema }),
});

/** Makes a product available on sales channels. Publishing it again changes nothing. */
export const PUBLISHABLE_PUBLISH_MUTATION: ShopifyOperation<
  z.infer<typeof publishablePublishDataSchema>,
  PublishablePublishVariables
> = {
  name: 'PublishablePublish',
  document: /* GraphQL */ `
    mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors {
          field
          message
        }
      }
    }
  `,
  schema: publishablePublishDataSchema,
};
