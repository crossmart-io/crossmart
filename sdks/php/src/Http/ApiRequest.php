<?php

declare(strict_types=1);

namespace Crossmart\Http;

/**
 * One call to the API, before it becomes an HTTP request.
 */
final class ApiRequest
{
    /**
     * @param string $pathTemplate The path with `{name}` placeholders, such as `/api/v1/workspaces/{workspaceId}`.
     * @param array<string, string> $pathParameters The value of each placeholder.
     * @param array<string, mixed> $query Query parameters; null values are left out.
     * @param array<string, mixed>|null $body The JSON body, or null for none.
     */
    public function __construct(
        public readonly HttpMethod $method,
        public readonly string $pathTemplate,
        public readonly array $pathParameters = [],
        public readonly array $query = [],
        public readonly ?array $body = null,
    ) {
    }
}
