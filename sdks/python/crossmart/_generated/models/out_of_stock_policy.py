from enum import StrEnum


class OutOfStockPolicy(StrEnum):
    CONTINUE_SELLING = "CONTINUE_SELLING"
    STOP_SELLING = "STOP_SELLING"

    def __str__(self) -> str:
        return str(self.value)
