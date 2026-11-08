from enum import StrEnum


class AgentWorkerTurnTrigger(StrEnum):
    DECISION = "decision"
    MESSAGE = "message"

    def __str__(self) -> str:
        return str(self.value)
