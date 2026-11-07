from enum import StrEnum


class AskEscalationStatus(StrEnum):
    OPEN = "open"
    REPLIED = "replied"

    def __str__(self) -> str:
        return str(self.value)
