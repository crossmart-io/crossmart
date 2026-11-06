<?php

declare(strict_types=1);

namespace Crossmart\Generator\Spec;

use JsonException;
use UnexpectedValueException;

/**
 * The parts of the OpenAPI document the generator reads: component schemas and operations.
 */
final class SpecDocument
{
    private const JSON_CONTENT_TYPE = 'application/json';
    private const SUCCESS_STATUS_PREFIX = '2';
    private const DEFAULT_TAG = 'Default';
    private const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'];

    private function __construct(private readonly Node $root)
    {
    }

    /**
     * @throws JsonException
     */
    public static function fromFile(string $path): self
    {
        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new UnexpectedValueException(sprintf('Cannot read the OpenAPI document at %s.', $path));
        }
        $decoded = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new UnexpectedValueException('The OpenAPI document is not a JSON object.');
        }

        $root = [];
        foreach ($decoded as $key => $value) {
            $root[(string) $key] = $value;
        }

        return new self(new Node($root));
    }

    /**
     * @return array<string, Schema>
     */
    public function schemas(): array
    {
        $schemas = [];
        foreach ($this->root->node('components')?->nodeMap('schemas') ?? [] as $name => $schema) {
            $schemas[(string) $name] = new Schema($schema);
        }

        return $schemas;
    }

    /**
     * @return list<Operation>
     */
    public function operations(): array
    {
        $operations = [];
        foreach ($this->root->nodeMap('paths') as $path => $pathItem) {
            foreach (self::HTTP_METHODS as $method) {
                $operation = $pathItem->node($method);
                if ($operation !== null) {
                    $operations[] = $this->operation((string) $path, $method, $operation);
                }
            }
        }

        return $operations;
    }

    private function operation(string $path, string $method, Node $node): Operation
    {
        $body = $node->node('requestBody')?->node('content');

        return new Operation(
            id: $node->requireString('operationId'),
            httpMethod: $method,
            path: $path,
            tag: $node->stringList('tags')[0] ?? self::DEFAULT_TAG,
            summary: $node->string('summary'),
            description: $node->string('description'),
            parameters: array_map($this->parameter(...), $node->nodeList('parameters')),
            jsonBody: $this->jsonSchema($body),
            hasUnsupportedBody: $body !== null && !$body->has(self::JSON_CONTENT_TYPE),
            successSchema: $this->successSchema($node),
        );
    }

    private function parameter(Node $node): Parameter
    {
        return new Parameter(
            name: $node->requireString('name'),
            location: ParameterLocation::from($node->requireString('in')),
            required: $node->isTrue('required'),
            schema: new Schema($node->node('schema') ?? new Node([])),
            description: $node->string('description'),
        );
    }

    private function successSchema(Node $operation): ?Schema
    {
        foreach ($operation->nodeMap('responses') as $status => $response) {
            if (str_starts_with((string) $status, self::SUCCESS_STATUS_PREFIX)) {
                return $this->jsonSchema($response->node('content'));
            }
        }

        return null;
    }

    private function jsonSchema(?Node $content): ?Schema
    {
        $schema = $content?->node(self::JSON_CONTENT_TYPE)?->node('schema');

        return $schema === null ? null : new Schema($schema);
    }
}
