<?php

declare(strict_types=1);

namespace Crossmart\Tests\Generator;

use Crossmart\Generator\Writer\NameFormatter;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use UnexpectedValueException;

final class NameFormatterTest extends TestCase
{
    /**
     * @return iterable<array{string, string}>
     */
    public static function enumCases(): iterable
    {
        yield ['ACTIVE', 'Active'];
        yield ['NEEDS_REAUTH', 'NeedsReauth'];
        yield ['last_30_days', 'Last30Days'];
        yield ['updatedAt', 'UpdatedAt'];
        yield ['products:edit', 'ProductsEdit'];
        yield ['api-keys:manage', 'ApiKeysManage'];
        yield ['image/jpeg', 'ImageJpeg'];
        yield ['2020_2026', 'Value2020_2026'];
        yield ['1990s', 'Value1990s'];
    }

    #[DataProvider('enumCases')]
    public function testNamesEnumCases(string $value, string $expected): void
    {
        self::assertSame($expected, (new NameFormatter())->enumCase($value));
    }

    public function testNamesOperationMethods(): void
    {
        self::assertSame('productsControllerListV1', (new NameFormatter())->camelCase('ProductsController_list_v1'));
    }

    public function testNamesTagClasses(): void
    {
        self::assertSame('ApiKeys', (new NameFormatter())->pascalCase('API keys'));
    }

    public function testRejectsNamesThatAreNotIdentifiers(): void
    {
        $this->expectException(UnexpectedValueException::class);

        (new NameFormatter())->identifier('x-api-key');
    }
}
