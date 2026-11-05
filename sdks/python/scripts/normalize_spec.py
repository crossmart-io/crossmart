"""Rewrites the parts of the OpenAPI document that openapi-python-client misreads.

NestJS Swagger describes a nullable nested object as
``{"nullable": true, "allOf": [{"$ref": ...}]}``.
The generator drops ``nullable`` next to ``allOf``, so a ``null`` in a response would fail to parse.
The same schema written as ``{"nullable": true, "oneOf": [{"$ref": ...}]}`` means the same thing in
OpenAPI 3.0 and generates ``Model | None``.

Usage: python normalize_spec.py <input.json> <output.json>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

NULLABLE_KEY = "nullable"
ALL_OF_KEY = "allOf"
ONE_OF_KEY = "oneOf"
TYPE_KEY = "type"
JSON_INDENTATION = 2
EXPECTED_ARGUMENT_COUNT = 3


def is_nullable_single_all_of(schema: dict[str, Any]) -> bool:
    """Whether the schema is a nullable wrapper around exactly one other schema."""
    all_of = schema.get(ALL_OF_KEY)
    return schema.get(NULLABLE_KEY) is True and isinstance(all_of, list) and len(all_of) == 1


def rewrite_nullable_all_of(schema: dict[str, Any]) -> None:
    """Turns a nullable single ``allOf`` into a nullable single ``oneOf``, in place."""
    schema[ONE_OF_KEY] = schema.pop(ALL_OF_KEY)
    schema.pop(TYPE_KEY, None)


def normalize(node: Any) -> None:
    """Walks the document and rewrites every nullable single ``allOf``."""
    if isinstance(node, dict):
        if is_nullable_single_all_of(node):
            rewrite_nullable_all_of(node)
        for child in node.values():
            normalize(child)
    elif isinstance(node, list):
        for child in node:
            normalize(child)


def main(arguments: list[str]) -> None:
    if len(arguments) != EXPECTED_ARGUMENT_COUNT:
        raise SystemExit(__doc__)
    source_path, target_path = Path(arguments[1]), Path(arguments[2])
    document = json.loads(source_path.read_text(encoding="utf-8"))
    normalize(document)
    target_path.write_text(json.dumps(document, indent=JSON_INDENTATION), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv)
