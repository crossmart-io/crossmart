#!/usr/bin/env bash
# Verifies the PHP SDK: the generated code matches the API's OpenAPI document, PHPStan passes at
# the maximum level, and the PHPUnit tests pass. Exits non-zero on the first failure.
#
# Usage: scripts/check.sh [path/to/openapi.json]
# The default document is the one `pnpm openapi:generate` writes at the repository root.
set -euo pipefail

SDK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SDK_DIR"

if [[ ! -d vendor ]]; then
  composer install --no-interaction --no-progress
fi

echo "== composer validate"
composer validate --strict --no-check-lock

echo "== drift check"
php scripts/generate.php --check "$@"

echo "== phpstan"
vendor/bin/phpstan analyse --no-progress --memory-limit=1G

echo "== phpunit"
vendor/bin/phpunit
