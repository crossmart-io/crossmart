import { Injectable } from '@nestjs/common';
import { MercadoLibreSingleItemWriter } from './mercadolibre-single-item.writer.js';
import { MercadoLibreUserProductWriter } from './mercadolibre-user-product.writer.js';

/** The two item models a listing is written in: one item with variations, or User Products. */
@Injectable()
export class MercadoLibreListingWriters {
  constructor(
    readonly singleItem: MercadoLibreSingleItemWriter,
    readonly userProduct: MercadoLibreUserProductWriter,
  ) {}
}
