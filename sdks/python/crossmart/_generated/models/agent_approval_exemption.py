from enum import StrEnum


class AgentApprovalExemption(StrEnum):
    NEW_DRAFT = "new_draft"

    def __str__(self) -> str:
        return str(self.value)
