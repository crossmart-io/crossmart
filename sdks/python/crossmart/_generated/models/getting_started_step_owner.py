from enum import StrEnum


class GettingStartedStepOwner(StrEnum):
    AGENT = "agent"
    MERCHANT = "merchant"

    def __str__(self) -> str:
        return str(self.value)
