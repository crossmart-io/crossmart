from enum import StrEnum


class AgentWorkerActionRisk(StrEnum):
    BULK = "bulk"
    DESTRUCTIVE = "destructive"
    PRICE_CHANGE = "price_change"

    def __str__(self) -> str:
        return str(self.value)
