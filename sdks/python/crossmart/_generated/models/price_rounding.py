from enum import StrEnum


class PriceRounding(StrEnum):
    ENDING_95 = "ending_95"
    ENDING_99 = "ending_99"
    NONE = "none"
    WHOLE = "whole"

    def __str__(self) -> str:
        return str(self.value)
