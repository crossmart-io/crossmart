import { z } from 'zod';
import type { ShopifyOperation } from './shopify-operation.js';

const appUninstallSchema = z.object({
  appUninstall: z.object({
    userErrors: z.array(z.object({ message: z.string() })),
  }),
});

export type AppUninstallData = z.infer<typeof appUninstallSchema>;

/**
 * Uninstalls the app from the store, which revokes its access tokens and deletes its webhook
 * subscriptions. Shopify has no separate token revocation endpoint.
 */
export const APP_UNINSTALL_MUTATION: ShopifyOperation<AppUninstallData> = {
  name: 'AppUninstall',
  document: /* GraphQL */ `
    mutation AppUninstall {
      appUninstall {
        userErrors {
          message
        }
      }
    }
  `,
  schema: appUninstallSchema,
};
