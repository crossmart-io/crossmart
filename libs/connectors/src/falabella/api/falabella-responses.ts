import { z } from 'zod';
import { xmlList, xmlObject, xmlOptionalText } from './falabella-xml.js';

/** `<Head>` of a successful response; `RequestId` is the feed id of a write. */
export const successHeadSchema = z.object({
  RequestId: xmlOptionalText,
  RequestAction: z.string(),
  TotalCount: z.string().optional(),
});

/** One explanation of a refusal (`ErrorDetail`). */
export const errorDetailSchema = z.object({
  Field: xmlOptionalText.optional(),
  Message: xmlOptionalText.optional(),
  SellerSku: xmlOptionalText.optional(),
});

export type FalabellaErrorDetail = z.infer<typeof errorDetailSchema>;

/** `<ErrorResponse>`: what Falabella answers when it does not run a call. */
export const errorResponseSchema = z.object({
  ErrorResponse: z.object({
    Head: z.object({
      ErrorType: xmlOptionalText.optional(),
      ErrorCode: xmlOptionalText.optional(),
      ErrorMessage: xmlOptionalText.optional(),
    }),
    Body: xmlObject({ ErrorDetail: xmlList(errorDetailSchema).optional() }).optional(),
  }),
});

export type FalabellaErrorResponse = z.infer<typeof errorResponseSchema>['ErrorResponse'];

export interface FalabellaSuccessDocument<TBody> {
  SuccessResponse: { Head: z.output<typeof successHeadSchema>; Body: TBody };
}

/** `<SuccessResponse>` with a body read by `body`. */
export function successResponseSchema<TBody>(
  body: z.ZodType<TBody>,
): z.ZodType<FalabellaSuccessDocument<TBody>> {
  return z.object({ SuccessResponse: z.object({ Head: successHeadSchema, Body: body }) });
}

/** A successful response's head and body. */
export interface FalabellaSuccess<TBody> {
  head: z.infer<typeof successHeadSchema>;
  body: TBody;
}
