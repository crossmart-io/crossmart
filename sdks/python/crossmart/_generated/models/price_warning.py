from enum import StrEnum


class PriceWarning(StrEnum):
    BELOW_FLOOR = "below_floor"
    CLAMPED_TO_ZERO = "clamped_to_zero"
    COMPARE_AT_DROPPED = "compare_at_dropped"
    MISSING_COST = "missing_cost"
    NO_EXCHANGE_RATE = "no_exchange_rate"

    def __str__(self) -> str:
        return str(self.value)
