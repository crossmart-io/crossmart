from enum import StrEnum


class SuggestionStatus(StrEnum):
    APPLIED = "APPLIED"
    PENDING = "PENDING"
    REJECTED = "REJECTED"
    STALE = "STALE"

    def __str__(self) -> str:
        return str(self.value)
