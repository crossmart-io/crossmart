from enum import StrEnum


class SandboxOpeningOutcome(StrEnum):
    CREATED = "created"
    SIGN_IN_REQUIRED = "sign_in_required"

    def __str__(self) -> str:
        return str(self.value)
