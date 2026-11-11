<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\GettingStartedStep;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class GettingStartedDto implements JsonSerializable
{
    /**
     * @param bool $emailVerified Whether the caller (or the key’s creator) confirmed their email
     * @param bool $unclaimedSandbox An account an AI agent opened that nobody has claimed yet
     * @param int|float $connectedStores Stores that are not disconnected
     * @param int|float $liveListings Listings live on a store
     * @param int|float $pendingProposals Outside agents’ changes waiting for approval
     * @param bool $agentChangesNeedApproval Whether outside agents’ changes wait for the seller’s approval
     * @param GettingStartedStep|string|null $nextStep The first step still to take; null once every step is done
     * @param list<GettingStartedStepDto> $steps The steps that apply, in order
     * @param list<StoreConnectLinkDto> $connectStoreLinks
     */
    public function __construct(
        public readonly bool $emailVerified,
        public readonly bool $unclaimedSandbox,
        public readonly int|float $products,
        public readonly int|float $connectedStores,
        public readonly int|float $liveListings,
        public readonly int|float $pendingProposals,
        public readonly bool $agentChangesNeedApproval,
        public readonly GettingStartedStep|string|null $nextStep,
        public readonly array $steps,
        public readonly array $connectStoreLinks,
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
            emailVerified: $payload->bool('emailVerified'),
            unclaimedSandbox: $payload->bool('unclaimedSandbox'),
            products: $payload->number('products'),
            connectedStores: $payload->number('connectedStores'),
            liveListings: $payload->number('liveListings'),
            pendingProposals: $payload->number('pendingProposals'),
            agentChangesNeedApproval: $payload->bool('agentChangesNeedApproval'),
            nextStep: $payload->isNull('nextStep') ? null : $payload->enum('nextStep', GettingStartedStep::class),
            steps: $payload->modelList('steps', GettingStartedStepDto::fromArray(...)),
            connectStoreLinks: $payload->modelList('connectStoreLinks', StoreConnectLinkDto::fromArray(...)),
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
            'emailVerified' => $this->emailVerified,
            'unclaimedSandbox' => $this->unclaimedSandbox,
            'products' => $this->products,
            'connectedStores' => $this->connectedStores,
            'liveListings' => $this->liveListings,
            'pendingProposals' => $this->pendingProposals,
            'agentChangesNeedApproval' => $this->agentChangesNeedApproval,
            'nextStep' => Payload::enumValue($this->nextStep),
            'steps' => array_map(static fn (GettingStartedStepDto $item): array => $item->toArray(), $this->steps),
            'connectStoreLinks' => array_map(static fn (StoreConnectLinkDto $item): array => $item->toArray(), $this->connectStoreLinks),
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
