import { Injectable } from '@nestjs/common';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { MercadoLibreApiClient } from '../api/mercadolibre-api.client.js';
import {
  MERCADOLIBRE_GRANT_PATH,
  MERCADOLIBRE_ME_PATH,
  MercadoLibrePathParam,
} from '../mercadolibre.constants.js';
import {
  type MercadoLibreUser,
  mercadoLibreRevokedGrantSchema,
  mercadoLibreUserSchema,
} from './mercadolibre-user.types.js';

/** The seller a token belongs to, and the app's grant on their account. */
@Injectable()
export class MercadoLibreUserReader {
  constructor(private readonly api: MercadoLibreApiClient) {}

  readMe(accessToken: string): Promise<MercadoLibreUser> {
    return this.api.get({ accessToken, path: MERCADOLIBRE_ME_PATH }, mercadoLibreUserSchema);
  }

  /** Removes the app's authorization from the seller's account. */
  async revokeGrant(accessToken: string, userId: string, appId: string): Promise<void> {
    await this.api.call(
      {
        method: HttpMethod.Delete,
        accessToken,
        path: MERCADOLIBRE_GRANT_PATH,
        params: { [MercadoLibrePathParam.UserId]: userId, [MercadoLibrePathParam.AppId]: appId },
      },
      mercadoLibreRevokedGrantSchema,
    );
  }
}
