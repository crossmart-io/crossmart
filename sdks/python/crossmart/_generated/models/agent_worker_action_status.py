from enum import StrEnum


class AgentWorkerActionStatus(StrEnum):
    CANCELLED = "cancelled"
    EXECUTED = "executed"
    EXECUTING = "executing"
    EXECUTION_FAILED = "execution_failed"
    EXPIRED = "expired"
    FAILED = "failed"
    PROPOSED = "proposed"
    REFUSED = "refused"
    REJECTED = "rejected"
    RUNNING = "running"
    SUCCEEDED = "succeeded"

    def __str__(self) -> str:
        return str(self.value)
