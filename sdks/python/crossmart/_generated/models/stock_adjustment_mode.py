from enum import StrEnum


class StockAdjustmentMode(StrEnum):
    DELTA = "delta"
    SET = "set"

    def __str__(self) -> str:
        return str(self.value)
