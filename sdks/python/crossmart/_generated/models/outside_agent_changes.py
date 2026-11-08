from enum import StrEnum


class OutsideAgentChanges(StrEnum):
    APPLY_DIRECTLY = "apply_directly"
    REQUIRE_APPROVAL = "require_approval"

    def __str__(self) -> str:
        return str(self.value)
