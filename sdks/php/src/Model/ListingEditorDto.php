<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ListingDisplayState;
use Crossmart\Enum\PublishRequirement;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ListingEditorDto implements JsonSerializable
{
    /**
     * @param bool $selected Whether the connection’s product selection includes it
     * @param ListingDisplayState|string $displayState The product on this store, in one state computed by the server: `draft` (not selected for the store), `needs_details` (selected, but the store setup or the product lacks something publishing needs), `ready` (publishable, not sent yet), `publishing` (queued or in flight, including an update of a published listing that a sync or retry queued), `published`, `failed`, `removing` (being taken off) or `removed`.
     * @param string|null $displayReason For `needs_details` and `failed`: a short, merchant-readable reason (what to add, or the channel’s message). Never holds secrets. Null for the other states.
     * @param PublishRequirement|string|null $displayRequirement For `needs_details`: the requirement to fix first, so a client can open the right place. Store-setup requirements (`reconnect`, `account_settings`, `shipping_policy`, `payment_policy`, `return_policy`, `ship_from_location`, `listing_setup`) come before the product’s (`images`, `active_product`, `option_names`), which the server checks before publishing; `category` and `item_specifics` are known once the channel refused a publish. Null for the other states.
     * @param InheritedTextListDto $images Image URLs in order; an override is a subset of the product’s, in its order
     * @param list<ListingEditorVariantDto> $variants
     * @param DateTimeImmutable|null $overrideUpdatedAt When the overrides last changed; null when there are none
     */
    public function __construct(
        public readonly string $productId,
        public readonly ConnectionSummaryDto $connection,
        public readonly bool $selected,
        public readonly ListingDisplayState|string $displayState,
        public readonly ?string $displayReason,
        public readonly PublishRequirement|string|null $displayRequirement,
        public readonly ?ListingSummaryDto $listing,
        public readonly InheritedTextDto $title,
        public readonly InheritedTextDto $descriptionHtml,
        public readonly InheritedTextListDto $tags,
        public readonly InheritedTextListDto $images,
        public readonly InheritedVisibilityDto $visibility,
        public readonly ListingStockLimitsDto $stock,
        public readonly array $variants,
        public readonly ListingCategoryFieldDto $category,
        public readonly ListingItemSpecificsSummaryDto $itemSpecifics,
        public readonly ?DateTimeImmutable $overrideUpdatedAt,
    ) {
    }

    /**
     * Builds the model from the API's JSON shape.
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $payload = new Payload($data, self::class);

        return new self(
            productId: $payload->string('productId'),
            connection: $payload->model('connection', ConnectionSummaryDto::fromArray(...)),
            selected: $payload->bool('selected'),
            displayState: $payload->enum('displayState', ListingDisplayState::class),
            displayReason: $payload->isNull('displayReason') ? null : $payload->string('displayReason'),
            displayRequirement: $payload->isNull('displayRequirement') ? null : $payload->enum('displayRequirement', PublishRequirement::class),
            listing: $payload->isNull('listing') ? null : $payload->model('listing', ListingSummaryDto::fromArray(...)),
            title: $payload->model('title', InheritedTextDto::fromArray(...)),
            descriptionHtml: $payload->model('descriptionHtml', InheritedTextDto::fromArray(...)),
            tags: $payload->model('tags', InheritedTextListDto::fromArray(...)),
            images: $payload->model('images', InheritedTextListDto::fromArray(...)),
            visibility: $payload->model('visibility', InheritedVisibilityDto::fromArray(...)),
            stock: $payload->model('stock', ListingStockLimitsDto::fromArray(...)),
            variants: $payload->modelList('variants', ListingEditorVariantDto::fromArray(...)),
            category: $payload->model('category', ListingCategoryFieldDto::fromArray(...)),
            itemSpecifics: $payload->model('itemSpecifics', ListingItemSpecificsSummaryDto::fromArray(...)),
            overrideUpdatedAt: $payload->isNull('overrideUpdatedAt') ? null : $payload->dateTime('overrideUpdatedAt'),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'productId' => $this->productId,
            'connection' => $this->connection->toArray(),
            'selected' => $this->selected,
            'displayState' => Payload::enumValue($this->displayState),
            'displayReason' => $this->displayReason,
            'displayRequirement' => Payload::enumValue($this->displayRequirement),
            'listing' => $this->listing?->toArray(),
            'title' => $this->title->toArray(),
            'descriptionHtml' => $this->descriptionHtml->toArray(),
            'tags' => $this->tags->toArray(),
            'images' => $this->images->toArray(),
            'visibility' => $this->visibility->toArray(),
            'stock' => $this->stock->toArray(),
            'variants' => array_map(static fn (ListingEditorVariantDto $item): array => $item->toArray(), $this->variants),
            'category' => $this->category->toArray(),
            'itemSpecifics' => $this->itemSpecifics->toArray(),
            'overrideUpdatedAt' => $this->overrideUpdatedAt === null ? null : Payload::formatDateTime($this->overrideUpdatedAt),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
