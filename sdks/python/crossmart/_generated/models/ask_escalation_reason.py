from enum import StrEnum


class AskEscalationReason(StrEnum):
    HUMAN_REQUESTED = "human_requested"
    LOW_CONFIDENCE = "low_confidence"
    SALES = "sales"
    UNANSWERED = "unanswered"

    def __str__(self) -> str:
        return str(self.value)
