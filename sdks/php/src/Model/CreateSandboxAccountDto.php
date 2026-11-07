<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CreateSandboxAccountDto implements JsonSerializable
{
    /**
     * @param string $email The person the account is for. The claim link goes to this address.
     * @param string $storeName What to call the store; the person can rename it later
     */
    public function __construct(
        public readonly string $email,
        public readonly string $storeName,
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
            email: $payload->string('email'),
            storeName: $payload->string('storeName'),
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
            'email' => $this->email,
            'storeName' => $this->storeName,
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
