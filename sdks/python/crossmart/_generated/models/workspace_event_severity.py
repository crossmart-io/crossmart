from enum import StrEnum


class WorkspaceEventSeverity(StrEnum):
    ERROR = "error"
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"

    def __str__(self) -> str:
        return str(self.value)
