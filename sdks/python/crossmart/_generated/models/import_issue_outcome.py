from enum import StrEnum


class ImportIssueOutcome(StrEnum):
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"

    def __str__(self) -> str:
        return str(self.value)
