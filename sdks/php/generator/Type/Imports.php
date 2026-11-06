<?php

declare(strict_types=1);

namespace Crossmart\Generator\Type;

/**
 * The `use` statements of one generated file.
 */
final class Imports
{
    private const NAMESPACE_SEPARATOR = '\\';

    /** @var array<string, true> */
    private array $classNames = [];

    public function __construct(private readonly string $namespace)
    {
    }

    /**
     * Records a class and returns the short name the file refers to it by.
     */
    public function use(string $className): string
    {
        $separator = strrpos($className, self::NAMESPACE_SEPARATOR);
        $namespace = $separator === false ? '' : substr($className, 0, $separator);
        if ($namespace !== $this->namespace) {
            $this->classNames[$className] = true;
        }

        return $separator === false ? $className : substr($className, $separator + 1);
    }

    /**
     * @return list<string>
     */
    public function statements(): array
    {
        $classNames = array_keys($this->classNames);
        sort($classNames);

        return array_map(static fn (string $className): string => sprintf('use %s;', $className), $classNames);
    }
}
