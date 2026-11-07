from enum import StrEnum


class AgentWorkerErrorCode(StrEnum):
    AI_UNAVAILABLE = "ai_unavailable"
    ANSWER_UNUSABLE = "answer_unusable"
    CREDITS_EXHAUSTED = "credits_exhausted"
    INTERNAL = "internal"
    SANDBOX_CLAIM_REQUIRED = "sandbox_claim_required"

    def __str__(self) -> str:
        return str(self.value)
