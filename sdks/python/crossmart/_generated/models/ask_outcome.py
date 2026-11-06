from enum import StrEnum


class AskOutcome(StrEnum):
    ANSWERED = "answered"
    OUT_OF_SCOPE = "out_of_scope"
    UNKNOWN = "unknown"

    def __str__(self) -> str:
        return str(self.value)
