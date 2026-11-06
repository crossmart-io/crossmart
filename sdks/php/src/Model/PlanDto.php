<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class PlanDto implements JsonSerializable
{
    /**
     * @param string $code Stable identifier of the plan
     * @param int|float $version The plan version the organization is on; later versions never change it
     * @param bool $offered Whether new organizations can choose this plan. False for a legacy plan, which an organization already on it keeps
     */
    public function __construct(
        public readonly string $code,
        public readonly string $name,
        public readonly int|float $version,
        public readonly bool $offered,
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
            code: $payload->string('code'),
            name: $payload->string('name'),
            version: $payload->number('version'),
            offered: $payload->bool('offered'),
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
            'code' => $this->code,
            'name' => $this->name,
            'version' => $this->version,
            'offered' => $this->offered,
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
