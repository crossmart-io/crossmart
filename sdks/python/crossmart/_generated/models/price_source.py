from enum import StrEnum


class PriceSource(StrEnum):
    BASE = "base"
    OVERRIDE = "override"
    RULE = "rule"

    def __str__(self) -> str:
        return str(self.value)
