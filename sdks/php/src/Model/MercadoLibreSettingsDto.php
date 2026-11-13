<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\MercadoLibreSiteId;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class MercadoLibreSettingsDto implements JsonSerializable
{
    /**
     * @param string $userId The seller’s Mercado Libre user id
     * @param MercadoLibreSiteId|string $siteId The country site the seller sells on
     * @param string $currencyCode ISO 4217 code of the site’s currency
     * @param bool $userProductSeller Whether the seller lists under User Products: one item per variant, each with its own price
     */
    public function __construct(
        public readonly string $userId,
        public readonly string $nickname,
        public readonly MercadoLibreSiteId|string $siteId,
        public readonly string $currencyCode,
        public readonly ?string $permalink,
        public readonly bool $userProductSeller,
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
            userId: $payload->string('userId'),
            nickname: $payload->string('nickname'),
            siteId: $payload->enum('siteId', MercadoLibreSiteId::class),
            currencyCode: $payload->string('currencyCode'),
            permalink: $payload->isNull('permalink') ? null : $payload->string('permalink'),
            userProductSeller: $payload->bool('userProductSeller'),
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
            'userId' => $this->userId,
            'nickname' => $this->nickname,
            'siteId' => Payload::enumValue($this->siteId),
            'currencyCode' => $this->currencyCode,
            'permalink' => $this->permalink,
            'userProductSeller' => $this->userProductSeller,
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
