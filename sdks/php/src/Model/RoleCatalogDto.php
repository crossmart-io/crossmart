<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class RoleCatalogDto implements JsonSerializable
{
    /**
     * @param list<BuiltInRoleDto> $builtIn Most access first
     * @param list<CustomRoleDto> $custom By name
     */
    public function __construct(
        public readonly array $builtIn,
        public readonly array $custom,
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
            builtIn: $payload->modelList('builtIn', BuiltInRoleDto::fromArray(...)),
            custom: $payload->modelList('custom', CustomRoleDto::fromArray(...)),
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
            'builtIn' => array_map(static fn (BuiltInRoleDto $item): array => $item->toArray(), $this->builtIn),
            'custom' => array_map(static fn (CustomRoleDto $item): array => $item->toArray(), $this->custom),
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
