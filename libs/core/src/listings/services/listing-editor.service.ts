import { Injectable } from '@nestjs/common';
import type { ListingEditorView } from '../entities/listing-editor.js';
import { ListingEditorViews } from './listing-editor.views.js';
import { ProductChannelsService } from './product-channels.service.js';

/** The listing editor of one product on one store: every field with what it inherits. */
@Injectable()
export class ListingEditorService {
  constructor(
    private readonly channels: ProductChannelsService,
    private readonly views: ListingEditorViews,
  ) {}

  async get(
    workspaceId: string,
    productId: string,
    connectionId: string,
  ): Promise<ListingEditorView> {
    const { product, connection, listing } = await this.channels.load(
      workspaceId,
      productId,
      connectionId,
    );
    return this.views.build(workspaceId, product, connection, listing);
  }
}
