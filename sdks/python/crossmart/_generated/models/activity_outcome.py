from enum import StrEnum


class ActivityOutcome(StrEnum):
    FAILED = "FAILED"
    SUCCEEDED = "SUCCEEDED"

    def __str__(self) -> str:
        return str(self.value)
