from enum import StrEnum


class ImportIssueCode(StrEnum):
    ALREADY_EXISTS = "already_exists"
    ALREADY_LINKED = "already_linked"
    DUPLICATE_ROW = "duplicate_row"
    DUPLICATE_SKU = "duplicate_sku"
    INVALID_OPTIONS = "invalid_options"
    INVALID_VALUE = "invalid_value"
    MISSING_VALUE = "missing_value"
    NOT_FOUND = "not_found"
    NOT_TRACKED = "not_tracked"
    UNKNOWN_SKU = "unknown_sku"
    UNMATCHED_VARIANT = "unmatched_variant"

    def __str__(self) -> str:
        return str(self.value)
