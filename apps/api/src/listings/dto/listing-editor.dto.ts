import { ApiProperty } from '@nestjs/swagger';
import { PublishRequirement } from '@crossmart/connectors';
import {
  type InheritedField,
  type ListingCategoryField,
  ListingDisplayState,
  type ListingEditorVariant,
  type ListingEditorView,
  type ListingItemSpecificsSummary,
  type ListingStockLimits,
} from '@crossmart/core';
import { ListingVisibility } from '@crossmart/database';
import { LISTING_VISIBILITY_SCHEMA_NAME } from '../listings.constants.js';
import { ChannelCategoryDto } from './channel-category.dto.js';
import { ListingSummaryDto } from './channel-listing.dto.js';
import {
  DisplayReasonProperty,
  DisplayRequirementProperty,
  DisplayStateProperty,
} from './listing-display.decorators.js';
import { ResolvedPriceDto } from './price-resolution.dto.js';
import { ConnectionSummaryDto } from './product-channel.dto.js';

const OVERRIDDEN_DESCRIPTION = 'Whether the store overrides it; reverting sets `override` to null';

/** A text field: the product's value, the store's override (null follows it) and the result. */
export class InheritedTextDto implements InheritedField<string> {
  @ApiProperty({ description: 'The product’s value' })
  product: string;

  @ApiProperty({ type: String, nullable: true, description: 'Null when it follows the product' })
  override: string | null;

  @ApiProperty({ description: 'What the store gets' })
  effective: string;

  @ApiProperty({ description: OVERRIDDEN_DESCRIPTION })
  overridden: boolean;
}

/** A list field (tags, image URLs), each part in order. */
export class InheritedTextListDto implements InheritedField<string[]> {
  @ApiProperty({ type: [String] })
  product: string[];

  @ApiProperty({ type: [String], nullable: true, description: 'Null when it follows the product' })
  override: string[] | null;

  @ApiProperty({ type: [String] })
  effective: string[];

  @ApiProperty({ description: OVERRIDDEN_DESCRIPTION })
  overridden: boolean;
}

/** Whether the store shows the product; the product's value follows its status. */
export class InheritedVisibilityDto implements InheritedField<ListingVisibility> {
  @ApiProperty({
    enum: ListingVisibility,
    enumName: LISTING_VISIBILITY_SCHEMA_NAME,
    description: '`VISIBLE` when the product is active, else `HIDDEN`',
  })
  product: ListingVisibility;

  @ApiProperty({
    enum: ListingVisibility,
    enumName: LISTING_VISIBILITY_SCHEMA_NAME,
    nullable: true,
  })
  override: ListingVisibility | null;

  @ApiProperty({ enum: ListingVisibility, enumName: LISTING_VISIBILITY_SCHEMA_NAME })
  effective: ListingVisibility;

  @ApiProperty({ description: OVERRIDDEN_DESCRIPTION })
  overridden: boolean;
}

/** A variant's price: the catalog's, the store's fixed one, and what the store gets. */
export class InheritedPriceDto implements InheritedField<string> {
  @ApiProperty({ example: '89.00', description: 'The catalog price, in the workspace currency' })
  product: string;

  @ApiProperty({ type: String, nullable: true, example: '79.00' })
  override: string | null;

  @ApiProperty({
    example: '102.99',
    description: 'In the store’s currency: the override, else the pricing rule’s result',
  })
  effective: string;

  @ApiProperty({ description: OVERRIDDEN_DESCRIPTION })
  overridden: boolean;
}

/** A variant's compare-at price, which may be absent at every level. */
export class InheritedCompareAtPriceDto implements InheritedField<string | null> {
  @ApiProperty({ type: String, nullable: true, description: 'In the workspace currency' })
  product: string | null;

  @ApiProperty({ type: String, nullable: true })
  override: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'In the store’s currency' })
  effective: string | null;

  @ApiProperty({ description: OVERRIDDEN_DESCRIPTION })
  overridden: boolean;
}

export class ListingEditorVariantDto implements ListingEditorVariant {
  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty({ example: 'Blue / Large' })
  title: string;

  @ApiProperty({ type: String, nullable: true })
  sku: string | null;

  @ApiProperty({ type: InheritedPriceDto })
  price: InheritedPriceDto;

  @ApiProperty({ type: InheritedCompareAtPriceDto })
  compareAtPrice: InheritedCompareAtPriceDto;

  @ApiProperty({ type: ResolvedPriceDto, description: 'How the effective price was reached' })
  resolvedPrice: ResolvedPriceDto;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'The stock the store shows; null when the variant does not track stock',
  })
  quantity: number | null;

  static from(variant: ListingEditorVariant): ListingEditorVariantDto {
    return Object.assign(new ListingEditorVariantDto(), {
      ...variant,
      price: Object.assign(new InheritedPriceDto(), variant.price),
      compareAtPrice: Object.assign(new InheritedCompareAtPriceDto(), variant.compareAtPrice),
      resolvedPrice: ResolvedPriceDto.from(variant.resolvedPrice),
    });
  }
}

export class ListingStockLimitsDto implements ListingStockLimits {
  @ApiProperty({ type: Number, nullable: true, description: 'Units held back from this store' })
  inventoryBuffer: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'The most units this store shows' })
  maxQuantity: number | null;
}

export class ListingCategoryFieldDto implements ListingCategoryField {
  @ApiProperty({ description: 'Whether the channel has categories (eBay)' })
  supported: boolean;

  @ApiProperty({
    type: ChannelCategoryDto,
    nullable: true,
    description: 'Null until the merchant chose one or a publish picked one',
  })
  value: ChannelCategoryDto | null;
}

export class ListingItemSpecificsSummaryDto implements ListingItemSpecificsSummary {
  @ApiProperty({ description: 'Whether the channel has item specifics (eBay)' })
  supported: boolean;

  @ApiProperty({ description: 'How many item specifics the merchant set on the listing' })
  count: number;

  @ApiProperty({ type: [String], example: ['Brand', 'Color'] })
  names: string[];
}

/** One product on one store, for the listing editor: every field with what it inherits. */
export class ListingEditorDto implements ListingEditorView {
  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ type: ConnectionSummaryDto })
  connection: ConnectionSummaryDto;

  @ApiProperty({ description: 'Whether the connection’s product selection includes it' })
  selected: boolean;

  @DisplayStateProperty()
  displayState: ListingDisplayState;

  @DisplayReasonProperty()
  displayReason: string | null;

  @DisplayRequirementProperty()
  displayRequirement: PublishRequirement | null;

  @ApiProperty({ type: ListingSummaryDto, nullable: true })
  listing: ListingSummaryDto | null;

  @ApiProperty({ type: InheritedTextDto })
  title: InheritedTextDto;

  @ApiProperty({ type: InheritedTextDto })
  descriptionHtml: InheritedTextDto;

  @ApiProperty({ type: InheritedTextListDto })
  tags: InheritedTextListDto;

  @ApiProperty({
    type: InheritedTextListDto,
    description: 'Image URLs in order; an override is a subset of the product’s, in its order',
  })
  images: InheritedTextListDto;

  @ApiProperty({ type: InheritedVisibilityDto })
  visibility: InheritedVisibilityDto;

  @ApiProperty({ type: ListingStockLimitsDto })
  stock: ListingStockLimitsDto;

  @ApiProperty({ type: [ListingEditorVariantDto] })
  variants: ListingEditorVariantDto[];

  @ApiProperty({ type: ListingCategoryFieldDto })
  category: ListingCategoryFieldDto;

  @ApiProperty({ type: ListingItemSpecificsSummaryDto })
  itemSpecifics: ListingItemSpecificsSummaryDto;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'When the overrides last changed; null when there are none',
  })
  overrideUpdatedAt: Date | null;

  static from(view: ListingEditorView): ListingEditorDto {
    return Object.assign(new ListingEditorDto(), {
      ...view,
      connection: Object.assign(new ConnectionSummaryDto(), view.connection),
      listing: view.listing ? ListingSummaryDto.from(view.listing) : null,
      title: Object.assign(new InheritedTextDto(), view.title),
      descriptionHtml: Object.assign(new InheritedTextDto(), view.descriptionHtml),
      tags: Object.assign(new InheritedTextListDto(), view.tags),
      images: Object.assign(new InheritedTextListDto(), view.images),
      visibility: Object.assign(new InheritedVisibilityDto(), view.visibility),
      stock: Object.assign(new ListingStockLimitsDto(), view.stock),
      variants: view.variants.map((variant) => ListingEditorVariantDto.from(variant)),
      category: Object.assign(new ListingCategoryFieldDto(), {
        supported: view.category.supported,
        value: ChannelCategoryDto.fromNullable(view.category.value),
      }),
      itemSpecifics: Object.assign(new ListingItemSpecificsSummaryDto(), view.itemSpecifics),
    });
  }
}
