<?php

declare(strict_types=1);

namespace Crossmart\Generator\Spec;

/**
 * A path or query parameter of an operation.
 */
final class Parameter
{
    public function __construct(
        public readonly string $name,
        public readonly ParameterLocation $location,
        public readonly bool $required,
        public readonly Schema $schema,
        public readonly ?string $description,
    ) {
    }
}
