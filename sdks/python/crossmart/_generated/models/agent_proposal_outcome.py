from enum import StrEnum


class AgentProposalOutcome(StrEnum):
    APPLY_DIRECTLY = "apply_directly"
    PROPOSED = "proposed"

    def __str__(self) -> str:
        return str(self.value)
