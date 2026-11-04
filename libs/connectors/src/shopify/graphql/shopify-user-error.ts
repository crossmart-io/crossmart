import { z } from 'zod';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { SHOPIFY_USER_ERROR_SEPARATOR } from '../shopify.constants.js';

/** A `userErrors` entry: the input was rejected, with the path to the field at fault. */
export const shopifyUserErrorSchema = z.object({
  field: z.array(z.string()).nullable().optional(),
  message: z.string(),
  code: z.string().nullable().optional(),
});

export type ShopifyUserError = z.infer<typeof shopifyUserErrorSchema>;

export const shopifyUserErrorsSchema = z.array(shopifyUserErrorSchema);

/** Throws the input's rejection as a channel error the merchant can read, if there is one. */
export function assertNoUserErrors(errors: readonly ShopifyUserError[]): void {
  if (errors.length > 0) {
    throw new ChannelError(
      ChannelType.Shopify,
      ChannelErrorCode.RequestRejected,
      errors.map((error) => error.message).join(SHOPIFY_USER_ERROR_SEPARATOR),
    );
  }
}
