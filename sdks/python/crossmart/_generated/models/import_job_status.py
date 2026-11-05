from enum import StrEnum


class ImportJobStatus(StrEnum):
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PROCESSING = "PROCESSING"

    def __str__(self) -> str:
        return str(self.value)
