<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class StartedAuthorizationDto implements JsonSerializable
{
    /**
     * @param string $authorizationUrl Send the merchant here to approve the app on the channel
     * @param string $accountHandle The account handle, normalized: a myshopify.com domain, an eBay marketplace id, or a lower-cased Etsy shop name
     * @param string $externalAccountId The same value as `accountHandle`. Use `accountHandle` instead.
     */
    public function __construct(
        public readonly string $authorizationUrl,
        public readonly string $accountHandle,
        public readonly string $externalAccountId,
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
            authorizationUrl: $payload->string('authorizationUrl'),
            accountHandle: $payload->string('accountHandle'),
            externalAccountId: $payload->string('externalAccountId'),
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
            'authorizationUrl' => $this->authorizationUrl,
            'accountHandle' => $this->accountHandle,
            'externalAccountId' => $this->externalAccountId,
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
