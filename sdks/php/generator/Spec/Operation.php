<?php

declare(strict_types=1);

namespace Crossmart\Generator\Spec;

/**
 * One HTTP operation of the API, such as `GET /api/v1/workspaces/{workspaceId}/products`.
 */
final class Operation
{
    /**
     * @param list<Parameter> $parameters
     */
    public function __construct(
        public readonly string $id,
        public readonly string $httpMethod,
        public readonly string $path,
        public readonly string $tag,
        public readonly ?string $summary,
        public readonly ?string $description,
        public readonly array $parameters,
        public readonly ?Schema $jsonBody,
        public readonly bool $hasUnsupportedBody,
        public readonly ?Schema $successSchema,
    ) {
    }

    /**
     * @return list<Parameter>
     */
    public function parametersIn(ParameterLocation $location): array
    {
        return array_values(array_filter(
            $this->parameters,
            static fn (Parameter $parameter): bool => $parameter->location === $location,
        ));
    }
}
