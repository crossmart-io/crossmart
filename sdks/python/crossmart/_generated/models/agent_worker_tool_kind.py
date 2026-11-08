from enum import StrEnum


class AgentWorkerToolKind(StrEnum):
    READ = "read"
    WRITE = "write"

    def __str__(self) -> str:
        return str(self.value)
