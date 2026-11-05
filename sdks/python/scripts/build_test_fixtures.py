"""Writes sample response bodies for the tests, built from the OpenAPI document's schemas.

Each fixture fills every required property with a placeholder of the right type, and fills
nullable nested objects with ``null`` so the tests cover the nullable models. Rerun it after an
API change makes a fixture fail to parse:

    python scripts/build_test_fixtures.py ../../openapi.json tests/fixtures
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

SCHEMAS = (
    "ProductDto",
    "ProductSummaryDto",
    "InventoryItemDto",
    "ChannelConnectionDto",
    "ProductChannelDto",
    "OrderSummaryDto",
    "OrderDetailDto",
    "SalesReportDto",
    "SuggestionDto",
    "WorkspaceDto",
    "CurrentApiKeyDto",
    "AiUsageReportDto",
)
SAMPLE_UUID = "00000000-0000-4000-8000-000000000001"
SAMPLE_DATE_TIME = "2026-01-01T00:00:00.000Z"
SAMPLE_STRING = "sample"
SAMPLE_NUMBER = 1
REF_PREFIX = "#/components/schemas/"
STRING_SAMPLES = {"uuid": SAMPLE_UUID, "date-time": SAMPLE_DATE_TIME}
JSON_INDENTATION = 2
EXPECTED_ARGUMENT_COUNT = 3


class SampleBuilder:
    """Builds the smallest valid instance of a schema."""

    def __init__(self, schemas: dict[str, Any]) -> None:
        self._schemas = schemas

    def build(self, schema: dict[str, Any]) -> Any:
        if "$ref" in schema:
            return self.build(self._schemas[schema["$ref"].removeprefix(REF_PREFIX)])
        if schema.get("nullable") and (schema.get("allOf") or schema.get("oneOf")):
            return None
        for composite in ("allOf", "oneOf", "anyOf"):
            if composite in schema:
                return self.build(schema[composite][0])
        if "enum" in schema:
            return schema["enum"][0]
        return self._build_typed(schema)

    def _build_typed(self, schema: dict[str, Any]) -> Any:
        schema_type = schema.get("type")
        if schema_type == "object" or "properties" in schema:
            return self._build_object(schema)
        if schema_type == "array":
            return []
        if schema_type in ("number", "integer"):
            return SAMPLE_NUMBER
        if schema_type == "boolean":
            return True
        return STRING_SAMPLES.get(schema.get("format", ""), SAMPLE_STRING)

    def _build_object(self, schema: dict[str, Any]) -> dict[str, Any]:
        properties = schema.get("properties", {})
        return {name: self.build(properties[name]) for name in schema.get("required", [])}


def main(arguments: list[str]) -> None:
    if len(arguments) != EXPECTED_ARGUMENT_COUNT:
        raise SystemExit(__doc__)
    document = json.loads(Path(arguments[1]).read_text(encoding="utf-8"))
    schemas = document["components"]["schemas"]
    builder = SampleBuilder(schemas)
    output_dir = Path(arguments[2])
    for name in SCHEMAS:
        sample = builder.build(schemas[name])
        path = output_dir / f"{name}.json"
        path.write_text(json.dumps(sample, indent=JSON_INDENTATION) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv)
