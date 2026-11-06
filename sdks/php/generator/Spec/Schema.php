<?php

declare(strict_types=1);

namespace Crossmart\Generator\Spec;

/**
 * A schema of the OpenAPI document: a component, a property, a parameter or a body.
 */
final class Schema
{
    private const REF_PREFIX = '#/components/schemas/';

    public function __construct(private readonly Node $node)
    {
    }

    /**
     * The component this schema points to, directly or through a single `allOf`, which is how
     * NestJS describes a nullable or documented reference.
     */
    public function referencedName(): ?string
    {
        $ref = $this->node->string('$ref') ?? $this->singleAllOf()?->node->string('$ref');

        return $ref === null ? null : substr($ref, strlen(self::REF_PREFIX));
    }

    public function type(): ?string
    {
        return $this->node->string('type');
    }

    public function format(): ?string
    {
        return $this->node->string('format');
    }

    public function description(): ?string
    {
        return $this->node->string('description');
    }

    public function isNullable(): bool
    {
        return $this->node->isTrue('nullable');
    }

    public function isEnum(): bool
    {
        return $this->node->has('enum');
    }

    public function isArray(): bool
    {
        return $this->type() === OpenApiType::ARRAY;
    }

    public function isObject(): bool
    {
        return $this->type() === OpenApiType::OBJECT || $this->node->has('properties');
    }

    public function items(): ?self
    {
        $items = $this->node->node('items');

        return $items === null ? null : new self($items);
    }

    /**
     * @return list<string>
     */
    public function enumValues(): array
    {
        return $this->node->stringList('enum');
    }

    /**
     * @return array<int|string, self>
     */
    public function properties(): array
    {
        return array_map(static fn (Node $property): self => new self($property), $this->node->nodeMap('properties'));
    }

    /**
     * @return list<string>
     */
    public function required(): array
    {
        return $this->node->stringList('required');
    }

    private function singleAllOf(): ?self
    {
        $allOf = $this->node->nodeList('allOf');

        return count($allOf) === 1 ? new self($allOf[0]) : null;
    }
}
