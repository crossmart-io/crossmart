from enum import StrEnum


class SalesRange(StrEnum):
    LAST_12_MONTHS = "last_12_months"
    LAST_30_DAYS = "last_30_days"
    LAST_7_DAYS = "last_7_days"
    LAST_90_DAYS = "last_90_days"

    def __str__(self) -> str:
        return str(self.value)
