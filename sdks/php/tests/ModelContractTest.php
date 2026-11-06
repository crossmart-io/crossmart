<?php

declare(strict_types=1);

namespace Crossmart\Tests;

use Crossmart\Enum\ProductStatus;
use Crossmart\Exception\InvalidPayloadException;
use Crossmart\Model\ProductDto;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * The generated models read every fixture built from the API's schemas, and write it back unchanged.
 */
final class ModelContractTest extends TestCase
{
    private const MODEL_NAMESPACE = 'Crossmart\\Model\\';

    /**
     * @return iterable<string, array{string}>
     */
    public static function fixtures(): iterable
    {
        $paths = glob(__DIR__ . '/Fixtures/*.json');
        foreach ($paths === false ? [] : $paths as $path) {
            $name = basename($path, '.json');

            yield $name => [$name];
        }
    }

    #[DataProvider('fixtures')]
    public function testRoundTripsTheFixture(string $name): void
    {
        $modelClass = self::MODEL_NAMESPACE . $name;
        self::assertTrue(class_exists($modelClass));
        $fixture = self::fixture($name);
        $fromArray = [$modelClass, 'fromArray'];
        self::assertIsCallable($fromArray);
        $model = $fromArray($fixture);

        self::assertInstanceOf($modelClass, $model);
        self::assertInstanceOf(\JsonSerializable::class, $model);
        self::assertSame(
            json_encode($fixture, JSON_THROW_ON_ERROR),
            json_encode($model, JSON_THROW_ON_ERROR),
        );
    }

    public function testNamesTheMissingField(): void
    {
        $fixture = self::fixture('ProductDto');
        unset($fixture['title']);

        $this->expectException(InvalidPayloadException::class);
        $this->expectExceptionMessage('ProductDto.title is missing.');

        ProductDto::fromArray($fixture);
    }

    public function testKeepsAnEnumValueAddedLaterAsAString(): void
    {
        $product = ProductDto::fromArray([...self::fixture('ProductDto'), 'status' => 'SCHEDULED']);

        self::assertSame('SCHEDULED', $product->status);
        self::assertSame('SCHEDULED', $product->toArray()['status']);
    }

    public function testReadsAKnownEnumValueAsItsCase(): void
    {
        $product = ProductDto::fromArray([...self::fixture('ProductDto'), 'status' => ProductStatus::Active->value]);

        self::assertSame(ProductStatus::Active, $product->status);
    }
}
