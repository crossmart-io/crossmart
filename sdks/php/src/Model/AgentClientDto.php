<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentClientRegistration;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentClientDto implements JsonSerializable
{
    /**
     * @param string $clientId The OAuth client id: a Client ID Metadata Document URL, or a registered id
     * @param string $name The name to show. Verified only for a `metadata_document` client, through `verifiedHost`; a `dynamic` client chose it itself, and any client can call itself "Claude".
     * @param AgentClientRegistration|string $registration `metadata_document`: Crossmart fetched the agent’s metadata from its HTTPS client id. `dynamic`: the agent registered itself, and its name and site are unverified.
     * @param string|null $verifiedHost For a `metadata_document` client: the host its metadata came from
     * @param string|null $claimedHost For a `dynamic` client: the HTTPS host of the site it claims. Not verified.
     */
    public function __construct(
        public readonly string $clientId,
        public readonly string $name,
        public readonly AgentClientRegistration|string $registration,
        public readonly ?string $verifiedHost,
        public readonly ?string $claimedHost,
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
            clientId: $payload->string('clientId'),
            name: $payload->string('name'),
            registration: $payload->enum('registration', AgentClientRegistration::class),
            verifiedHost: $payload->isNull('verifiedHost') ? null : $payload->string('verifiedHost'),
            claimedHost: $payload->isNull('claimedHost') ? null : $payload->string('claimedHost'),
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
            'clientId' => $this->clientId,
            'name' => $this->name,
            'registration' => Payload::enumValue($this->registration),
            'verifiedHost' => $this->verifiedHost,
            'claimedHost' => $this->claimedHost,
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
