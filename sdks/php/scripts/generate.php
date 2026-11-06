<?php

/**
 * Generates src/Api, src/Enum and src/Model from the Crossmart OpenAPI document.
 *
 *   composer generate       writes the files
 *   composer check:drift    fails when the committed files differ from a fresh generation
 *
 * The document is ../../openapi.json (written by `pnpm openapi:generate` in the repository
 * root). Pass another path as an argument, or set OPENAPI_SPEC.
 */

declare(strict_types=1);

use Crossmart\Generator\GenerateCommand;

require dirname(__DIR__) . '/vendor/autoload.php';

$commandLine = $_SERVER['argv'] ?? [];
$arguments = array_values(array_filter(array_slice(is_array($commandLine) ? $commandLine : [], 1), is_string(...)));

exit((new GenerateCommand(dirname(__DIR__)))->run($arguments));
