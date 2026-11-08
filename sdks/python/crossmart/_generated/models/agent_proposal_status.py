from enum import StrEnum


class AgentProposalStatus(StrEnum):
    APPLIED = "applied"
    APPLYING = "applying"
    EXPIRED = "expired"
    FAILED = "failed"
    PENDING = "pending"
    REJECTED = "rejected"

    def __str__(self) -> str:
        return str(self.value)
