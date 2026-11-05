from enum import StrEnum


class PriceStepKind(StrEnum):
    BASE = "base"
    CONVERSION = "conversion"
    FIXED_AMOUNT = "fixed_amount"
    FLOOR = "floor"
    OVERRIDE = "override"
    PERCENT = "percent"
    ROUNDING = "rounding"

    def __str__(self) -> str:
        return str(self.value)
