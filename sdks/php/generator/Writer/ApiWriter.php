<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

use Crossmart\Generator\GeneratorConfig;
use Crossmart\Generator\Spec\Operation;
use Crossmart\Generator\Spec\Parameter;
use Crossmart\Generator\Spec\ParameterLocation;
use Crossmart\Generator\Type\Imports;
use Crossmart\Generator\Type\PhpType;
use Crossmart\Generator\Type\TypeKind;
use Crossmart\Generator\Type\TypeResolver;
use UnexpectedValueException;

/**
 * Writes the operations of one tag as a class with one typed method per operation.
 */
final class ApiWriter
{
    private const INDENT = '    ';
    private const DOUBLE_INDENT = '        ';
    private const TRIPLE_INDENT = '            ';
    private const BODY_PARAMETER = 'body';
    private const THROWS_TAG = '@throws %s When the API cannot be reached or answers with an error.';

    public function __construct(
        private readonly TypeResolver $types,
        private readonly NameFormatter $names,
        private readonly DocBlock $docBlock,
    ) {
    }

    /**
     * @param list<Operation> $operations
     */
    public function write(string $tag, array $operations): GeneratedFile
    {
        $className = $this->className($tag);
        $imports = new Imports(GeneratorConfig::API_NAMESPACE);
        $methods = [];
        foreach ($operations as $operation) {
            array_push($methods, '', ...$this->method($operation, $imports));
        }
        $body = [
            ...$this->docBlock->render([sprintf('The operations tagged "%s".', $tag)], []),
            sprintf('final class %s', $className),
            '{',
            sprintf('%spublic function __construct(private readonly %s $transport)', self::INDENT, $imports->use(GeneratorConfig::TRANSPORT_CLASS)),
            self::INDENT . '{',
            self::INDENT . '}',
            ...$methods,
            '}',
        ];

        return GeneratedFile::forClass(GeneratorConfig::API_NAMESPACE, $className, $imports, $body);
    }

    public function className(string $tag): string
    {
        return $this->names->pascalCase($tag) . GeneratorConfig::API_CLASS_SUFFIX;
    }

    /**
     * @return list<string>
     */
    private function method(Operation $operation, Imports $imports): array
    {
        $arguments = $this->arguments($operation, $imports);
        $returnType = $operation->successSchema === null ? null : $this->types->resolve($operation->successSchema);

        return [
            ...$this->docBlock->render(
                [$operation->summary, $operation->description],
                $this->tags($arguments, $returnType, $imports),
                self::INDENT,
            ),
            ...$this->signature($this->names->camelCase($operation->id), $arguments, $returnType === null ? 'void' : $returnType->native($imports), $imports),
            ...$this->sendStatement($operation, $returnType, $imports),
            ...$this->returnStatement($returnType, $imports),
            self::INDENT . '}',
        ];
    }

    /**
     * Path parameters, then required query parameters, then the body, then optional query parameters.
     *
     * @return list<MethodArgument>
     */
    private function arguments(Operation $operation, Imports $imports): array
    {
        $query = array_map($this->argument(...), $operation->parametersIn(ParameterLocation::Query));
        $body = $operation->jsonBody === null ? [] : [new MethodArgument(
            name: self::BODY_PARAMETER,
            type: $this->types->resolve($operation->jsonBody),
            required: true,
            description: null,
        )];

        return [
            ...array_map($this->argument(...), $operation->parametersIn(ParameterLocation::Path)),
            ...array_filter($query, static fn (MethodArgument $argument): bool => $argument->required),
            ...$body,
            ...array_filter($query, static fn (MethodArgument $argument): bool => !$argument->required),
        ];
    }

    private function argument(Parameter $parameter): MethodArgument
    {
        if ($parameter->name === self::BODY_PARAMETER) {
            throw new UnexpectedValueException('A parameter named "body" would clash with the request body.');
        }

        return new MethodArgument(
            name: $this->names->identifier($parameter->name),
            type: $this->types->resolve($parameter->schema),
            required: $parameter->required,
            description: $parameter->description,
        );
    }

    /**
     * The `@param` and `@return` tags, then the `@throws` tag apart.
     *
     * @param list<MethodArgument> $arguments
     *
     * @return list<string>
     */
    private function tags(array $arguments, ?PhpType $returnType, Imports $imports): array
    {
        $typeTags = [...$this->paramTags($arguments, $imports), ...$this->returnTag($returnType, $imports)];
        $throwsTag = sprintf(self::THROWS_TAG, $imports->use(GeneratorConfig::API_EXCEPTION_CLASS));

        return $typeTags === [] ? [$throwsTag] : [...$typeTags, '', $throwsTag];
    }

    /**
     * @param list<MethodArgument> $arguments
     *
     * @return list<string>
     */
    private function paramTags(array $arguments, Imports $imports): array
    {
        return array_values(array_filter(
            array_map(fn (MethodArgument $argument): ?string => $argument->paramTag($imports, $this->docBlock), $arguments),
            static fn (?string $tag): bool => $tag !== null,
        ));
    }

    /**
     * @return list<string>
     */
    private function returnTag(?PhpType $type, Imports $imports): array
    {
        $doc = $type?->doc($imports);

        return $doc === null ? [] : [sprintf('@return %s', $doc)];
    }

    /**
     * One line without arguments, otherwise one argument per line.
     *
     * @param list<MethodArgument> $arguments
     *
     * @return list<string>
     */
    private function signature(string $name, array $arguments, string $returnType, Imports $imports): array
    {
        if ($arguments === []) {
            return [sprintf('%spublic function %s(): %s', self::INDENT, $name, $returnType), self::INDENT . '{'];
        }

        return [
            sprintf('%spublic function %s(', self::INDENT, $name),
            ...array_map(static fn (MethodArgument $argument): string => self::DOUBLE_INDENT . $argument->declaration($imports) . ',', $arguments),
            sprintf('%s): %s {', self::INDENT, $returnType),
        ];
    }

    /**
     * @return list<string>
     */
    private function sendStatement(Operation $operation, ?PhpType $returnType, Imports $imports): array
    {
        $assignment = $returnType === null ? '' : '$response = ';

        return [
            sprintf('%s%s$this->transport->send(new %s(', self::DOUBLE_INDENT, $assignment, $imports->use(GeneratorConfig::REQUEST_CLASS)),
            sprintf('%smethod: %s::%s,', self::TRIPLE_INDENT, $imports->use(GeneratorConfig::HTTP_METHOD_CLASS), $this->names->pascalCase($operation->httpMethod)),
            sprintf('%spathTemplate: %s,', self::TRIPLE_INDENT, PhpLiteral::string($operation->path)),
            ...$this->mapArgument('pathParameters', $operation->parametersIn(ParameterLocation::Path)),
            ...$this->mapArgument('query', $operation->parametersIn(ParameterLocation::Query)),
            ...$this->bodyArgument($operation),
            self::DOUBLE_INDENT . '));',
        ];
    }

    /**
     * @param list<Parameter> $parameters
     *
     * @return list<string>
     */
    private function mapArgument(string $name, array $parameters): array
    {
        if ($parameters === []) {
            return [];
        }
        $entries = array_map(
            static fn (Parameter $parameter): string => sprintf('%s => $%s', PhpLiteral::string($parameter->name), $parameter->name),
            $parameters,
        );

        return [sprintf('%s%s: [%s],', self::TRIPLE_INDENT, $name, implode(', ', $entries))];
    }

    /**
     * @return list<string>
     */
    private function bodyArgument(Operation $operation): array
    {
        if ($operation->jsonBody === null) {
            return [];
        }
        $isModel = $this->types->resolve($operation->jsonBody)->kind === TypeKind::Model;

        return [sprintf('%sbody: $%s%s,', self::TRIPLE_INDENT, self::BODY_PARAMETER, $isModel ? '->toArray()' : '')];
    }

    /**
     * @return list<string>
     */
    private function returnStatement(?PhpType $type, Imports $imports): array
    {
        if ($type === null) {
            return [];
        }

        return ['', self::DOUBLE_INDENT . 'return ' . $this->decodeResponse($type, $imports) . ';'];
    }

    private function decodeResponse(PhpType $type, Imports $imports): string
    {
        return match ($type->kind) {
            TypeKind::Model => sprintf('%s::fromArray($response->object())', $type->className($imports)),
            TypeKind::FreeForm => '$response->object()',
            TypeKind::List => $this->decodeListResponse($type, $imports),
            default => throw new UnexpectedValueException(sprintf('Responses of type %s are not supported.', $type->kind->name)),
        };
    }

    private function decodeListResponse(PhpType $type, Imports $imports): string
    {
        $item = $type->item() ?? throw new UnexpectedValueException('A list response has no item type.');
        if ($item->kind !== TypeKind::Model) {
            throw new UnexpectedValueException('Only lists of models are supported as responses.');
        }

        return sprintf('array_map(%s::fromArray(...), $response->objectList())', $item->className($imports));
    }
}
