import { z } from 'zod';

/** The fields Crossmart reads from `GET /users/me` (Queries about the user guide). */
export const mercadoLibreUserSchema = z.object({
  id: z.number().int().positive(),
  nickname: z.string().min(1),
  site_id: z.string(),
  permalink: z.string().nullish(),
  tags: z.array(z.string()).default([]),
});

export type MercadoLibreUser = z.infer<typeof mercadoLibreUserSchema>;

/** `DELETE /users/{user_id}/applications/{app_id}` answers the revoked grant. */
export const mercadoLibreRevokedGrantSchema = z.object({ msg: z.string().optional() }).loose();
