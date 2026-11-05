#!/usr/bin/env bash
# Regenerates crossmart/_generated from the API's OpenAPI document.
#
# Usage: scripts/generate.sh [path/to/openapi.json]
# The default spec is the one `pnpm openapi:generate` writes at the repository root.
# Needs the pinned dev tools: `pip install --group dev` (see pyproject.toml).
set -euo pipefail

SDK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC_PATH="${1:-$SDK_DIR/../../openapi.json}"
OUTPUT_DIR="$SDK_DIR/crossmart/_generated"
CONFIG_PATH="$SDK_DIR/openapi-python-client.yaml"

if [[ -d "$SDK_DIR/.venv/bin" ]]; then
  PATH="$SDK_DIR/.venv/bin:$PATH"
fi

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "OpenAPI document not found at $SPEC_PATH. Run 'pnpm build && pnpm openapi:generate' at the repository root first." >&2
  exit 1
fi

NORMALIZED_SPEC="$(mktemp -t crossmart-openapi.XXXXXX)"
trap 'rm -f "$NORMALIZED_SPEC"' EXIT
python "$SDK_DIR/scripts/normalize_spec.py" "$SPEC_PATH" "$NORMALIZED_SPEC"

openapi-python-client generate \
  --path "$NORMALIZED_SPEC" \
  --config "$CONFIG_PATH" \
  --meta none \
  --output-path "$OUTPUT_DIR" \
  --overwrite \
  --fail-on-warning
