<?php

/**
 * Writes sample response bodies for the tests, built from the OpenAPI document's schemas.
 *
 * Rerun it after an API change makes a fixture fail to parse:
 *
 *   php scripts/build-test-fixtures.php [path/to/openapi.json]
 */

declare(strict_types=1);

use Crossmart\Generator\Fixture\SampleBuilder;
use Crossmart\Generator\Spec\SpecDocument;

require dirname(__DIR__) . '/vendor/autoload.php';

const FIXTURE_SCHEMAS = [
    'ProductDto',
    'ProductSummaryDto',
    'InventoryItemDto',
    'ChannelConnectionDto',
    'ProductChannelDto',
    'ListingEditorDto',
    'OrderSummaryDto',
    'OrderDetailDto',
    'SalesReportDto',
    'SuggestionDto',
    'WorkspaceDto',
    'CurrentApiKeyDto',
    'AiUsageReportDto',
];
const DEFAULT_SPEC_PATH = __DIR__ . '/../../../openapi.json';
const FIXTURES_DIRECTORY = __DIR__ . '/../tests/Fixtures';
const JSON_FLAGS = JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR;

$commandLine = $_SERVER['argv'] ?? [];
$specPath = is_array($commandLine) && is_string($commandLine[1] ?? null) ? $commandLine[1] : DEFAULT_SPEC_PATH;
$schemas = SpecDocument::fromFile($specPath)->schemas();
$builder = new SampleBuilder($schemas);

foreach (FIXTURE_SCHEMAS as $name) {
    $sample = $builder->build($schemas[$name] ?? throw new UnexpectedValueException(sprintf('Unknown schema "%s".', $name)));
    file_put_contents(sprintf('%s/%s.json', FIXTURES_DIRECTORY, $name), json_encode($sample, JSON_FLAGS) . "\n");
}
