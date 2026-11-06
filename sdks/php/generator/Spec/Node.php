<?php

declare(strict_types=1);

namespace Crossmart\Generator\Spec;

use UnexpectedValueException;

/**
 * Typed access to one JSON object of the OpenAPI document.
 */
final class Node
{
    /**
     * @param array<string, mixed> $data
     */
    public function __construct(private readonly array $data)
    {
    }

    public function has(string $key): bool
    {
        return array_key_exists($key, $this->data);
    }

    public function string(string $key): ?string
    {
        $value = $this->data[$key] ?? null;

        return is_string($value) ? $value : null;
    }

    public function requireString(string $key): string
    {
        return $this->string($key) ?? throw new UnexpectedValueException(sprintf('The OpenAPI document lacks "%s".', $key));
    }

    public function isTrue(string $key): bool
    {
        return ($this->data[$key] ?? null) === true;
    }

    public function node(string $key): ?self
    {
        $value = $this->data[$key] ?? null;

        return is_array($value) ? self::fromArray($value) : null;
    }

    /**
     * The child objects by key. PHP turns numeric keys such as `"200"` into integers.
     *
     * @return array<int|string, self>
     */
    public function nodeMap(string $key): array
    {
        $value = $this->data[$key] ?? [];
        $nodes = [];
        foreach (is_array($value) ? $value : [] as $name => $child) {
            if (is_array($child)) {
                $nodes[$name] = self::fromArray($child);
            }
        }

        return $nodes;
    }

    /**
     * @return list<self>
     */
    public function nodeList(string $key): array
    {
        return array_values($this->nodeMap($key));
    }

    /**
     * @return list<string>
     */
    public function stringList(string $key): array
    {
        $value = $this->data[$key] ?? [];

        return array_values(array_filter(is_array($value) ? $value : [], is_string(...)));
    }

    /**
     * @param array<mixed> $data
     */
    private static function fromArray(array $data): self
    {
        $object = [];
        foreach ($data as $key => $value) {
            $object[(string) $key] = $value;
        }

        return new self($object);
    }
}
